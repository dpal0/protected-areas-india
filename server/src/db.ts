import 'dotenv/config';
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'pari',
  user: process.env.PGUSER || 'pari',
  password: process.env.PGPASSWORD || 'pari_dev_pw',
});