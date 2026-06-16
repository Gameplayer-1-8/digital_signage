import type { Config } from 'drizzle-kit';

export default {
  schema: './database/schema.ts',
  out: './drizzle',
  driver: 'mysql2',
  dbCredentials: {
    host: 'localhost',
    user: 'signage_user',
    password: 'signage_password',
    database: 'digital_signage',
    port: 3306,
  },
} satisfies Config;
