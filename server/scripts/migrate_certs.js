import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('🚀 Starting Certification Table Migration...');
  
  try {
    // 1. Create Certifications Table
    console.log('⏳ Creating certifications table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS certifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        issuer TEXT NOT NULL,
        issue_date TEXT,
        expiry_date TEXT,
        credential_id TEXT,
        url TEXT,
        skill_tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "certifications" created successfully.');

    // 2. Add an index for faster searching
    console.log('⏳ Creating indexes...');
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_cert_title ON certifications(title)`);
    console.log('✅ Indexes created.');

    console.log('\n✨ Database Migration Complete! Your Certification Vault is ready.');
  } catch (err) {
    console.error('❌ Migration Failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
