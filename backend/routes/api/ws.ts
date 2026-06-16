import { db } from '../../database';
import { devices } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { activePeers } from '../../utils/wsState';
import { broadcastSSE } from '../../utils/sse';

const peerToUuid = new Map<string, string>();

export default defineWebSocketHandler({
  open(peer) {
    console.log('[ws] Peer connected', peer.id);
  },

  async message(peer, message) {
    try {
      const data = JSON.parse(message.text());
      
      if (data.type === 'register' && data.uuid) {
        peerToUuid.set(peer.id, data.uuid);
        activePeers.set(data.uuid, peer);
        
        // Update online status
        await db.update(devices)
          .set({ isOnline: true, lastPing: new Date() })
          .where(eq(devices.uuid, data.uuid));
        console.log(`[ws] Device registered: ${data.uuid}`);
        broadcastSSE('device-update', { uuid: data.uuid, isOnline: true });
      } 

      else if (data.type === 'ping') {
        const uuid = data.uuid || peerToUuid.get(peer.id);
        if (uuid) {
          // Update ping timestamp
          await db.update(devices)
            .set({ isOnline: true, lastPing: new Date() })
            .where(eq(devices.uuid, uuid));
        }
      }
    } catch (e) {
      console.error('[ws] Invalid message', e);
    }
  },

  async close(peer, event) {
    try {
      console.log('[ws] Peer disconnected', peer.id);
      const uuid = peerToUuid.get(peer.id);
      if (uuid) {
        peerToUuid.delete(peer.id);
        activePeers.delete(uuid);
        await db.update(devices)
          .set({ isOnline: false })
          .where(eq(devices.uuid, uuid));
        console.log(`[ws] Device marked offline: ${uuid}`);
        broadcastSSE('device-update', { uuid, isOnline: false });
      }
    } catch (e) {
      console.error('[ws] Error in close handler:', e);
    }
  },

  error(peer, error) {
    console.error('[ws] Error', peer.id, error);
  }
});
