import { db } from '../../../database';
import { devices } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;

  if (method === 'GET') {
    const allDevices = await db
      .select({
        id: devices.id,
        name: devices.name,
        location: devices.location,
        lastPing: devices.lastPing,
        isOnline: devices.isOnline,
        activeMediaId: devices.activeMediaId
      })
      .from(devices);
      
    return allDevices;
  }

  if (method === 'POST') {
    const body = await readBody(event);
    if (!body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Name is required' });
    }
    
    await db.insert(devices).values({
      name: body.name,
      location: body.location || null,
    });
    
    return { status: 'success', message: 'Device added' };
  }
});
