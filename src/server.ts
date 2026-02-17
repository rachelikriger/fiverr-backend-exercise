import 'dotenv/config';
import app from './app.js';
import { pool } from './config/db.js';

const PORT = Number(process.env.PORT) || 3000;

async function start(): Promise<void> {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
