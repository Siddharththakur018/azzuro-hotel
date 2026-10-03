import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from '../src/database.js';

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL in backend/.env to your PostgreSQL or Supabase connection string.');
  process.exitCode = 1;
} else {
  try {
    const sql = await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
    await pool.query(sql);
    console.log('Database schema is ready.');
  } catch (error) {
    console.error(`Schema setup failed: ${error.message}`);
    process.exitCode = 1;
  } finally { await pool.end(); }
}
