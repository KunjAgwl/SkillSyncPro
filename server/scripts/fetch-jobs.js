// Fetches jobs from Adzuna and writes them to jobs.json (contains no API keys).
// Run locally; upload jobs.json to wherever load-jobs.js will run (it needs DB access).
import fs from 'node:fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const COUNTRY = process.env.ADZUNA_COUNTRY || 'in';
const PAGES = [1, 2, 3, 4]; // 4 x 50 = 200 jobs

if (!APP_ID || !APP_KEY) {
  console.error('❌ ADZUNA_APP_ID or ADZUNA_APP_KEY missing in .env');
  process.exit(1);
}

const jobs = [];
for (const page of PAGES) {
  const url = `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/${page}?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=50&content-type=application/json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`❌ Adzuna page ${page} failed: HTTP ${res.status}`);
    process.exit(1);
  }
  const data = await res.json();
  for (const job of data.results || []) {
    jobs.push({
      title: job.title,
      company: job.company?.display_name || 'Unknown',
      description: job.description,
      skills: JSON.stringify([job.category?.label, ...String(job.title).split(' ')].filter(Boolean)),
    });
  }
  console.log(`📄 Page ${page}: ${jobs.length} jobs so far`);
}

await fs.writeFile('jobs.json', JSON.stringify(jobs, null, 1), 'utf8');
console.log(`✅ Wrote ${jobs.length} jobs to jobs.json`);
