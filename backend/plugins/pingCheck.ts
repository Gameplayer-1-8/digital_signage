import { db } from '../database';
import { devices } from '../database/schema';
import { lte, and, eq } from 'drizzle-orm';
import { broadcastSSE } from '../utils/sse';

export default defineNitroPlugin((nitroApp) => {
  // Check every 10 seconds for devices that haven't pinged
  setInterval(async () => {
    try {
      // 30 seconds threshold
      const threshold = new Date(Date.now() - 30 * 1000);
      
      const offlineDevices = await db.select().from(devices)
        .where(and(eq(devices.isOnline, true), lte(devices.lastPing, threshold)));

      if (offlineDevices.length > 0) {
        for (const device of offlineDevices) {
          await db.update(devices)
            .set({ isOnline: false })
            .where(eq(devices.id, device.id));
            
          console.log(`[pingCheck] Device marked offline due to timeout: ${device.uuid}`);
          broadcastSSE('device-update', { uuid: device.uuid, isOnline: false });
        }
      }
    } catch (e) {
      console.error('[pingCheck] Error checking device status:', e);
    }
  }, 10000);
});
