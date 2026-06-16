export default defineEventHandler((event) => {
  return {
    status: 'ok',
    time: new Date().toISOString()
  };
});
