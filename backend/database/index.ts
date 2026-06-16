import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'signage_user',
  password: process.env.DB_PASSWORD || 'signage_password',
  database: process.env.DB_NAME || 'digital_signage',
  port: Number(process.env.DB_PORT) || 3306,
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
