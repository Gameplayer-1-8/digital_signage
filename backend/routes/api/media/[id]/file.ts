import { db } from '../../../../database';
import { media } from '../../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' });
  }

  const mediaRecord = await db.select().from(media).where(eq(media.id, parseInt(id))).limit(1);

  if (mediaRecord.length === 0 || !mediaRecord[0].fileData) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' });
  }

  const item = mediaRecord[0];

  // Set the correct Content-Type so the browser plays it properly
  setResponseHeader(event, 'Content-Type', item.mimeType || 'application/octet-stream');
  
  // Return the raw buffer
  return item.fileData;
});
