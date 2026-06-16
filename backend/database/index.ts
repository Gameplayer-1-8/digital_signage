import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const poolConnection = mysql.createPool({
  host: '127.0.0.1',
  user: 'signage_user',
  password: 'signage_password',
  database: 'digital_signage',
  port: 3306,
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
