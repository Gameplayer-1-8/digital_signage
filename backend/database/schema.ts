import { mysqlTable, serial, varchar, timestamp, boolean, int, customType } from 'drizzle-orm/mysql-core';

const longblob = customType<{ data: Buffer; driverData: string | Buffer }>({
  dataType() {
    return 'longblob';
  },
});

export const devices = mysqlTable('devices', {
  id: int('id').autoincrement().primaryKey(),
  uuid: varchar('uuid', { length: 36 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }),
  lastPing: timestamp('last_ping').defaultNow(),
  isOnline: boolean('is_online').default(false),
  activeMediaId: int('active_media_id'),
});

export const media = mysqlTable('media', {
  id: int('id').autoincrement().primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  filepath: varchar('filepath', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'image' or 'video'
  mimeType: varchar('mime_type', { length: 255 }),
  fileData: longblob('file_data'),
  durationDefault: int('duration_default').default(10), // in seconds
});
