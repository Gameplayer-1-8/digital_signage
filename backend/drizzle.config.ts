import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './database/schema.ts',
  out: './drizzle',
  driver: 'mysql2',
  dbCredentials: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'signage_user',
    password: process.env.DB_PASSWORD || 'signage_password',
    database: process.env.DB_NAME || 'digital_signage',
    port: Number(process.env.DB_PORT) || 3306,
  },
} satisfies Config;
