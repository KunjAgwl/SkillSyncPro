import dotenv from 'dotenv';
import { query, ensureSchema } from '../config/db.js';
import { embedText } from '../services/bedrock.js';

dotenv.config();

/** Titan Text Embeddings V2 via Amazon Bedrock (1024-D vector) */
const getEmbedding = async (text) => {
  try {
    return await embedText(text);
  } catch (err) {
    console.error('❌ Embedding Failure:', err.message);
    return null;
  }
};

/**
 * Main logic to process jobs without embeddings
 */
async function generateEmbeddings() {
  try {
    await ensureSchema();

    console.log('🔍 Fetching jobs without embeddings...');
    
    // 3. Get all jobs where embedding is NULL
    const jobs = await query('SELECT id, title, description FROM jobs WHERE embedding IS NULL');
    
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
        await query('UPDATE jobs SET embedding = $1::vector WHERE id = $2', [JSON.stringify(embedding), job.id]);
        
        processedCount++;
        if (processedCount % 5 === 0) {
          console.log(`✅ Progress: ${processedCount}/${jobs.length} processed...`);
        }
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Success! Generated embeddings for ${processedCount} jobs.`);
    
  } catch (error) {
    console.error('❌ Critical Error during embedding generation:', error);
  } finally {
    process.exit(0);
  }
}

generateEmbeddings();
