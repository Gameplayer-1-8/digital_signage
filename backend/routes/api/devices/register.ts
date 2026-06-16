import { db } from '../../../database';
import { devices } from '../../../database/schema';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;

  if (method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  }

  const uuid = crypto.randomUUID();
  const name = `Neues Gerät (${uuid.substring(0, 4)})`;

  await db.insert(devices).values({
    uuid,
    name,
  });

  return { status: 'success', uuid, message: 'Device registered automatically' };
});
