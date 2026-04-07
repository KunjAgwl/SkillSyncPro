import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

export const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDB() {
  try {
    // 1. Scan History Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resume_summary TEXT,
        top_match_title TEXT,
        top_match_company TEXT,
        match_score INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Database initialized: scan_history table is ready.');

    // Note: jobs table and jobs_idx are assumed to exist from seed scripts.
    const jobCheck = await client.execute('SELECT count(*) as count FROM jobs');
    console.log(`📦 Database Status: ${jobCheck.rows[0].count} jobs found in main table.`);
    
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
  }
}
