import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

// create a promise-based pool
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
