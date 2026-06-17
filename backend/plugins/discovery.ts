import dgram from 'dgram';
import os from 'os';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';

function getBroadcastAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const ipParts = iface.address.split('.').map(Number);
        const netmaskParts = iface.netmask.split('.').map(Number);
        const broadcastParts = ipParts.map((part, i) => (part & netmaskParts[i]) | (~netmaskParts[i] & 255));
        addresses.push(broadcastParts.join('.'));
      }
    }
  }
  addresses.push('255.255.255.255');
  return Array.from(new Set(addresses));
}

export default defineNitroPlugin((nitroApp) => {
  const server = dgram.createSocket('udp4');
  server.on('error', (err) => {
    console.error(`[Auto-Discovery] Server error:\n${err.stack}`);
  });

  // Ignore ECONNRESET and EOF on Windows which crashes the process
  process.on('uncaughtException', (err: any) => {
    if (err.code === 'ECONNRESET' || err.code === 'EOF' || err.code === 'EPIPE') {
      // Ignore
      return;
    }
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  server.bind(() => {
    server.setBroadcast(true);
    console.log('[Auto-Discovery] UDP Broadcast Server started');
    
    // Broadcast every 10 seconds
    setInterval(() => {
      const publicPort = process.env.PUBLIC_PORT || '5173';
      const apiPort = process.env.PUBLIC_API_PORT || '3000';
      const message = Buffer.from(`SIGNAGE_DISCOVERY:PORT:${publicPort}:API:${apiPort}`);
      const broadcastAddrs = getBroadcastAddresses();
      
      broadcastAddrs.forEach((addr) => {
        server.send(message, 0, message.length, 44444, addr, (err) => {
          if (err) {
            console.error(`[Auto-Discovery] Broadcast error to ${addr}`, err);
          }
        });
      });
      console.log(`[Auto-Discovery] Broadcast sent to: ${broadcastAddrs.join(', ')}`);
    }, 10000);
  });
});
