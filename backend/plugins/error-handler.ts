export default defineNitroPlugin((nitroApp) => {
  const ignoreEconnreset = (err: any) => {
    if (err && err.code === 'ECONNRESET') {
      console.warn('[Server] Ignored ECONNRESET error from abrupt client disconnect.');
      return true;
    }
    return false;
  };

  process.on('uncaughtException', (err: any) => {
    if (ignoreEconnreset(err)) return;
    console.error('[Server] Uncaught Exception caught to prevent crash:', err);
  });

  process.on('unhandledRejection', (reason: any, promise) => {
    if (ignoreEconnreset(reason)) return;
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  });
});
