import { defineConfig } from '@playwright/test';

const variant = process.env.PAYDEMO_VARIANT ?? 'fixed-v2';
const suite = process.env.PAYDEMO_SUITE ?? 'fixed';

export default defineConfig({
  testDir: './tests/paydemo',
  testMatch: suite === 'controlled-bug' ? /controlled-bug\.spec\.ts/ : /fixed\.spec\.ts/,
  timeout: 15_000,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node scripts/build-paydemo.mjs && node apps/paydemo/server.mjs',
    url: 'http://127.0.0.1:4173/build-info',
    timeout: 15_000,
    reuseExistingServer: false,
    env: { ...process.env, PAYDEMO_VARIANT: variant, PAYDEMO_PORT: '4173' },
  },
});
