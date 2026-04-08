import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Turso Connection
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Calls Gemini text-embedding-004 to get 768-D vector
 */
async function getEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2-preview:embedContent?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Gemini API Error:', data.error.message);
      return null;
    }

    if (!data.embedding || !data.embedding.values) {
      console.error('❌ Unexpected API Response Format:', JSON.stringify(data));
      return null;
    }

    return data.embedding.values;
  } catch (err) {
    console.error('❌ Embedding Fetch Failure:', err.message);
    return null;
  }
}

/**
 * Main logic to process jobs without embeddings
 */
async function generateEmbeddings() {
  if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY missing in .env');
    process.exit(1);
  }

  try {
    console.log('🛠️ Synchronizing Database Schema (3072-D upgrade)...');
    
    // Deep Migration: Recreate table to force dimension change
    try {
      // 1. Rename existing table as a backup
      await client.execute('ALTER TABLE jobs RENAME TO jobs_old');
      
      // 2. Create the new table with the correct 3072 dimension
      await client.execute(`
        CREATE TABLE jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          company TEXT,
          description TEXT,
          skills TEXT,
          embedding F32_BLOB(3072),
          UNIQUE(title, company)
        )
      `);

      // 3. Move existing data to the new table
      await client.execute(`
        INSERT INTO jobs (id, title, company, description, skills)
        SELECT id, title, company, description, skills FROM jobs_old
      `);

      // 4. Drop the old table
      await client.execute('DROP TABLE jobs_old');
      console.log('✅ Successfully migrated table to 3072-D.');
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('no such table: jobs')) {
         // Table already upgraded or fresh start
         console.log('ℹ️ Schema already up-to-date or fresh start.');
      } else {
        console.warn('⚠️ Migration note:', e.message);
      }
    }

    // 5. Ensure Vector Index exists
    try {
      await client.execute(`DROP INDEX IF EXISTS jobs_idx`);
      await client.execute(`CREATE INDEX jobs_idx ON jobs (libsql_vector_idx(embedding, 'metric=cosine'))`);
      console.log('✅ (Re)created vector index jobs_idx (3072-D).');
    } catch (e) {
      console.error('❌ Index Creation Error:', e.message);
    }

    console.log('🔍 Fetching jobs without embeddings...');
    
    // 3. Get all jobs where embedding is NULL
    const result = await client.execute('SELECT id, title, description FROM jobs WHERE embedding IS NULL');
    const jobs = result.rows;
    
    if (jobs.length === 0) {
      console.log('✅ All jobs already have embeddings!');
      process.exit(0);
    }

    console.log(`🤖 Processing ${jobs.length} jobs...`);

    let processedCount = 0;
    for (const job of jobs) {
      const contentToEmbed = `${job.title} ${job.description}`;
      const embedding = await getEmbedding(contentToEmbed);

      if (embedding) {
        await client.execute({
          sql: `UPDATE jobs SET embedding = vector(?) WHERE id = ?`,
          args: [JSON.stringify(embedding), job.id]
        });
        
        processedCount++;
        if (processedCount % 5 === 0) {
          console.log(`✅ Progress: ${processedCount}/${jobs.length} processed...`);
        }
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 Success! Generated embeddings for ${processedCount} jobs.`);
    
  } catch (error) {
    console.error('❌ Critical Error during embedding generation:', error);
  } finally {
    process.exit(0);
  }
}

generateEmbeddings();
