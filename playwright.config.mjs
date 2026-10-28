import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.QAMART_BASE_URL || 'https://qamart.vercel.app';
const target = new URL(baseURL);
if (target.origin !== 'https://qamart.vercel.app' && process.env.QAMART_ALLOW_CUSTOM_TARGET !== '1') {
  throw new Error('Custom target requires QAMART_ALLOW_CUSTOM_TARGET=1 after confirming it is a non-production QA deployment.');
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: true
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});