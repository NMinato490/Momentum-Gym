export async function register() {
  if (process.env.NODE_ENV === 'development') {
    const { startAutoSync } = await import('./lib/auto-sync');
    startAutoSync();
  }
}
