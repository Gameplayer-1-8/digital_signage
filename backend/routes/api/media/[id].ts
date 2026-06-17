import { db } from '../../../database';
import { media, devices } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import { activePeers } from '../../../utils/wsState';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' });
  }

  const mediaId = parseInt(id);

  if (method === 'DELETE') {
    // 1. Find devices using this media
    const affectedDevices = await db.select().from(devices).where(eq(devices.activeMediaId, mediaId));
    
    // 2. Set activeMediaId to null for those devices
    if (affectedDevices.length > 0) {
      await db.update(devices)
        .set({ activeMediaId: null })
        .where(eq(devices.activeMediaId, mediaId));
        
      // 3. Notify those devices via WebSocket
      affectedDevices.forEach(device => {
        if (device.uuid) {
          const peer = activePeers.get(device.uuid);
          if (peer) {
            peer.send(JSON.stringify({ type: 'reload' }));
          }
        }
      });
    }

    // 4. Delete the media record
    await db.delete(media).where(eq(media.id, mediaId));
    
    return { status: 'success', message: 'Media deleted' };
  }
});
