import 'dotenv/config';
import { pool } from '../config/db.js';

export async function truncateTables(): Promise<void> {
  await pool.query('TRUNCATE links CASCADE');
}
