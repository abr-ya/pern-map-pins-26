/** Logs when `DEV` or `VITE_DEBUG_CLERK=true` is set at build time (Vite injects literals). */
export function clerkDebug(...args: unknown[]): void {
  if (!import.meta.env.DEV && import.meta.env.VITE_DEBUG_CLERK !== 'true') return;
  console.info('[clerk]', ...args);
}
