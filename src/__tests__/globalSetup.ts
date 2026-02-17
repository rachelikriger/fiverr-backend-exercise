import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default async function setup(): Promise<void> {
  const initPath = join(__dirname, '../../scripts/init.sql');
  const sql = readFileSync(initPath, 'utf-8');
  try {
    await pool.query(sql);
  } catch (err) {
    if (err instanceof Error && !err.message.includes('already exists')) {
      throw err;
    }
  }
}
