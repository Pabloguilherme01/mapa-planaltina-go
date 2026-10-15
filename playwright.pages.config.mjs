import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-pages',
  testMatch: '**/*.pw.mjs',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174/mapa-planaltina-go/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build:pages && VITE_SITE_BASE=/mapa-planaltina-go/ npx vite preview --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174/mapa-planaltina-go/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
