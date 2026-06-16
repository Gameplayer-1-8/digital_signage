export default defineEventHandler((event) => {
  const socket = event.node.req.socket;
  if (socket && !(socket as any)._hasEconnresetHandler) {
    (socket as any)._hasEconnresetHandler = true;
    socket.on('error', (err: any) => {
      if (err.code === 'ECONNRESET' || err.code === 'EOF' || err.code === 'EPIPE') {
        // Silently ignore network disconnects to prevent server crashes
      } else {
        console.error('[Socket Error]', err);
      }
    });
  }
});
