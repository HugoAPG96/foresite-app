import { defineConfig, devices } from '@playwright/test';

// E2E contra el sistema REAL desplegado (Vercel -> Render -> Neon).
// No hay webServer: se apunta al front ya desplegado, que a su vez consume
// el backend real de Render. Este config NO se usa en CI.
const PROD_BASE_URL =
  process.env['E2E_PROD_BASE_URL'] ?? 'https://foresite-app.vercel.app';

export default defineConfig({
  testDir: './tests-prod',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: 1,
  // Render (free) puede tener cold start; timeouts amplios pero sin sleeps.
  timeout: 240 * 1000,
  expect: { timeout: 60 * 1000 },
  reporter: [
    // El reporte del sistema real se guarda directamente en las evidencias.
    ['html', { outputFolder: '../evidence/TA-002/playwright-report', open: 'never' }],
    ['line'],
  ],
  use: {
    baseURL: PROD_BASE_URL,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 60 * 1000,
    navigationTimeout: 90 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
