import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../config/db.js';
import { embedText } from './bedrock.js';

const JOBS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'jobs.json');

/**
 * First-start data load: inserts the bundled jobs (data/jobs.json) if the table is empty,
 * then creates Bedrock embeddings for every job that does not have one yet.
 * Runs in the background so the API can start serving immediately.
 */
export const bootstrapJobs = async () => {
  const [{ count }] = await query('SELECT count(*) AS count FROM jobs');
  if (count === 0) {
    let jobs = [];
    try {
      jobs = JSON.parse(await fs.readFile(JOBS_FILE, 'utf8'));
    } catch {
      console.log('ℹ️ No data/jobs.json bundled; skipping job bootstrap.');
    }
    for (const j of jobs) {
      await query(
        `INSERT INTO jobs (title, company, description, skills)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (title, company) DO NOTHING`,
        [j.title, j.company, j.description, j.skills]
      );
    }
    if (jobs.length) console.log(`📥 Bootstrap: inserted ${jobs.length} jobs.`);
  }

  const pending = await query('SELECT id, title, description FROM jobs WHERE embedding IS NULL');
  if (pending.length === 0) return;
  console.log(`🧠 Bootstrap: embedding ${pending.length} jobs with Bedrock...`);
  let done = 0;
  for (const job of pending) {
    try {
      const vec = await embedText(`${job.title} ${job.description}`);
      await query('UPDATE jobs SET embedding = $1::vector WHERE id = $2', [JSON.stringify(vec), job.id]);
      done++;
      if (done % 25 === 0) console.log(`✅ Embedded ${done}/${pending.length}`);
    } catch (err) {
      console.error(`❌ Embedding failed for job ${job.id}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`🎉 Bootstrap complete: ${done}/${pending.length} embeddings stored.`);
};
