import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? 'http://localhost:5173';

/**
 * Playwright config for 001-map-world-points.
 *
 * Strategy:
 * - Tests target the running Vite dev server (frontend). API responses are
 *   mocked per-test via `page.route(...)`, so no real DB is required.
 * - When `pnpm dev` is already running locally we reuse it; otherwise
 *   Playwright starts the frontend dev server itself.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter frontend dev',
    url: FRONTEND_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
