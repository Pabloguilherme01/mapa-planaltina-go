import { defineConfig, devices } from '@playwright/test';

const publicSite = process.env.PUBLIC_SITE_URL;
if (!publicSite || !/^https:\/\/[^/]+\/[^?#]*\/$/.test(publicSite)) {
  throw new Error('PUBLIC_SITE_URL deve indicar a raiz HTTPS publicada com / final.');
}

export default defineConfig({
  testDir: './e2e-published',
  testMatch: '**/*.pw.mjs',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: publicSite,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
});
