import { db } from '../../../../database';
import { media, devices } from '../../../../database/schema';
import { eq } from 'drizzle-orm';
import { activePeers } from '../../../../utils/wsState';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const deviceId = getRouterParam(event, 'id');

  if (!deviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Device ID required' });
  }

  // 1. Resolve UUID to internal ID, or fallback to parsing int (for backward compatibility)
  const deviceRecords = await db.select().from(devices).where(eq(devices.uuid, deviceId));
  const device = deviceRecords.length > 0 ? deviceRecords[0] : null;
  const internalId = device ? device.id : parseInt(deviceId);

  if (!internalId || isNaN(internalId)) {
    throw createError({ statusCode: 404, statusMessage: 'Device not found' });
  }

  if (method === 'GET') {
    // If we only have deviceId (int) and no device record, we need to fetch it to get activeMediaId
    const targetDevice = device || (await db.select().from(devices).where(eq(devices.id, internalId)))[0];
    
    if (!targetDevice || !targetDevice.activeMediaId) {
      return null;
    }

    const activeMedia = await db.select({
      id: media.id,
      filename: media.filename,
      filepath: media.filepath,
      type: media.type,
      mimeType: media.mimeType,
      durationDefault: media.durationDefault
    }).from(media).where(eq(media.id, targetDevice.activeMediaId));

    return activeMedia.length > 0 ? activeMedia[0] : null;
  }

  if (method === 'POST') {
    const body = await readBody(event);
    
    await db.update(devices)
      .set({ activeMediaId: body.mediaId || null })
      .where(eq(devices.id, internalId));

    // Determine the device's UUID to send a WS reload
    const targetDevice = device || (await db.select().from(devices).where(eq(devices.id, internalId)))[0];
    
    if (targetDevice && targetDevice.uuid) {
      const peer = activePeers.get(targetDevice.uuid);
      if (peer) {
        peer.send(JSON.stringify({ type: 'reload' }));
      }
    }

    return { status: 'success', message: 'Media assigned and device notified' };
  }
});
