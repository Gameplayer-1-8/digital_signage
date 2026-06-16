import { db } from '../../../database';
import { media } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;

  if (method === 'GET') {
    // Select everything except fileData to avoid huge JSON payloads
    const allMedia = await db.select({
      id: media.id,
      filename: media.filename,
      filepath: media.filepath,
      type: media.type,
      mimeType: media.mimeType,
      durationDefault: media.durationDefault
    }).from(media);
    return allMedia;
  }

  if (method === 'POST') {
    const formData = await readMultipartFormData(event);
    if (!formData) {
      throw createError({ statusCode: 400, statusMessage: 'No file data' });
    }

    const fileField = formData.find(f => f.name === 'file');
    if (!fileField || !fileField.data) {
      throw createError({ statusCode: 400, statusMessage: 'File is required' });
    }

    const filename = fileField.filename || 'unknown';
    const mimeType = fileField.type || 'application/octet-stream';
    const type = mimeType.startsWith('video/') ? 'video' : 'image';
    const fileData = fileField.data;

    const insertResult = await db.insert(media).values({
      filename,
      filepath: '', // placeholder
      type,
      mimeType,
      fileData: fileData as any,
      durationDefault: type === 'video' ? 30 : 10,
    });
    
    const insertId = insertResult[0].insertId;
    
    await db.update(media)
      .set({ filepath: `/api/media/${insertId}/file` })
      .where(eq(media.id, insertId));
      
    return { status: 'success', id: insertId, message: 'Media uploaded successfully' };
  }
});
