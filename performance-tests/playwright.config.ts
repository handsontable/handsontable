import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: 'test-results',
  testDir: './scenarios',
  testMatch: '**/*.spec.ts',
  globalTeardown: './lib/teardown.mjs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 5 * 60 * 1000,
  reporter: [['list']],
  use: {
    headless: true,
    viewport: { width: 1400, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
          args: [
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
          ],
        },
      },
    },
  ],
});
