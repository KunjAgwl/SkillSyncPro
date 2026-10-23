import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Return COUNT(*) etc. (bigint) as numbers instead of strings
pg.types.setTypeParser(20, (v) => parseInt(v, 10));

export const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'skillsync',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // RDS requires TLS; set DB_SSL=false for a local Postgres
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,
});

/** Run a parameterised query ($1, $2, ...) and return the rows. */
export const query = async (sql, params = []) => (await pool.query(sql, params)).rows;

/** Run an AI-generated query safely: single SELECT/WITH statement, read-only transaction. */
export const queryReadOnly = async (sql) => {
  const stmt = sql.trim().replace(/;+\s*$/, '');
  if (!/^(select|with)\b/i.test(stmt) || stmt.includes(';')) {
    throw new Error('Only a single read-only SELECT query is allowed.');
  }
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN READ ONLY');
    await conn.query("SET LOCAL statement_timeout = '5000'");
    const result = await conn.query(stmt);
    return result.rows;
  } finally {
    await conn.query('ROLLBACK').catch(() => {});
    conn.release();
  }
};

/** Create extension, tables and indexes (idempotent). */
export async function ensureSchema() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title TEXT,
      company TEXT,
      description TEXT,
      skills TEXT,
      embedding vector(1024),
      UNIQUE (title, company)
    )`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS jobs_idx ON jobs
    USING hnsw (embedding vector_cosine_ops)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id SERIAL PRIMARY KEY,
      resume_summary TEXT,
      top_match_title TEXT,
      top_match_company TEXT,
      match_score INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certifications (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date TEXT,
      expiry_date TEXT,
      credential_id TEXT,
      url TEXT,
      skill_tags TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cert_title ON certifications(title)');
}

export async function initDB() {
  try {
    await ensureSchema();
    console.log('✅ Database initialized: schema is ready.');
    const [{ count }] = await query('SELECT count(*) AS count FROM jobs');
    console.log(`📦 Database Status: ${count} jobs found in main table.`);
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
  }
}
