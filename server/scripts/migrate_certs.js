import { ensureSchema, pool } from '../config/db.js';

// Certifications table is now part of ensureSchema(); this script just runs it.
try {
  await ensureSchema();
  console.log('✅ Schema (including certifications) is ready.');
} catch (err) {
  console.error('❌ Migration Failed:', err.message);
} finally {
  await pool.end();
}
