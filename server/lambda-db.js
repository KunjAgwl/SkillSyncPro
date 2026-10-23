import { localQuery, localQueryReadOnly, localEnsureSchema } from './config/db.js';

// Runs inside the VPC next to the private RDS instance. It has no public URL: only IAM principals
// allowed to invoke this function (the API function's role) can reach it.
export const handler = async (event) => {
  try {
    switch (event?.op) {
      case 'query':
        return { rows: await localQuery(event.sql, event.params || []) };
      case 'queryReadOnly':
        return { rows: await localQueryReadOnly(event.sql) };
      case 'ensureSchema':
        await localEnsureSchema();
        return { rows: [] };
      default:
        return { error: `Unknown op: ${event?.op}` };
    }
  } catch (err) {
    console.error('DB function error:', err.message);
    return { error: err.message };
  }
};
