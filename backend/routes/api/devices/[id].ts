import { db } from '../../../database';
import { devices } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' });
  }

  if (method === 'DELETE') {
    await db.delete(devices).where(eq(devices.id, parseInt(id)));
    return { status: 'success', message: 'Device deleted' };
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    if (!body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Name is required' });
    }
    
    await db.update(devices).set({
      name: body.name,
      location: body.location || null,
    }).where(eq(devices.id, parseInt(id)));
    
    return { status: 'success', message: 'Device updated' };
  }
});
