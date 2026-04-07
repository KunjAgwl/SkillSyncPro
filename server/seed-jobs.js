import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Turso Connection
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const COUNTRY = 'in';

async function seedJobs() {
  if (!APP_ID || !APP_KEY) {
    console.error('❌ Error: ADZUNA_APP_ID or ADZUNA_APP_KEY missing in .env');
    process.exit(1);
  }

  try {
    console.log('🚀 Initializing Turso Job Database...');
    
    // Ensure basic table exists (SQLite syntax)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        company TEXT,
        description TEXT,
        skills TEXT,
        UNIQUE(title, company)
      )
    `);

    let totalFetched = 0;
    const pages = [1, 2, 3, 4]; // 200 jobs

    console.log(`📡 Fetching jobs from Adzuna (${COUNTRY})...`);

    for (const page of pages) {
      console.log(`📄 Fetching page ${page}...`);
      const url = `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/${page}?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=50&content-type=application/json`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        for (const job of data.results) {
          try {
            await client.execute({
              sql: `INSERT OR IGNORE INTO jobs (title, company, description, skills) 
                    VALUES (?, ?, ?, ?)`,
              args: [
                job.title, 
                job.company.display_name, 
                job.description, 
                JSON.stringify([job.category.label, ...job.title.split(' ')])
              ]
            });
            totalFetched++;
          } catch (e) {
            // Skip on error
          }
        }
      }
    }

    console.log(`\n✅ Success! Added ${totalFetched} raw jobs to Turso.`);
    console.log('👉 Next Step: Run "node generate-embeddings.js" to process them with AI.');
    
  } catch (error) {
    console.error('❌ Critical Error:', error);
  } finally {
    process.exit(0);
  }
}

seedJobs();
