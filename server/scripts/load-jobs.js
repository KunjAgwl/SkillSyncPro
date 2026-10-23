// Loads jobs.json into PostgreSQL (skips duplicates). Run where the database is reachable.
import fs from 'node:fs/promises';
import { query, ensureSchema, pool } from '../config/db.js';

const file = process.argv[2] || 'jobs.json';
const jobs = JSON.parse(await fs.readFile(file, 'utf8'));

try {
  await ensureSchema();
  let added = 0;
  for (const j of jobs) {
    const rows = await query(
      `INSERT INTO jobs (title, company, description, skills)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (title, company) DO NOTHING
       RETURNING id`,
      [j.title, j.company, j.description, j.skills]
    );
    added += rows.length;
  }
  console.log(`✅ Loaded ${added} new jobs (${jobs.length - added} duplicates skipped).`);
} finally {
  await pool.end();
}
