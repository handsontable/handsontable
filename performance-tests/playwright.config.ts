import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: 'test-results',
  testDir: './scenarios',
  testMatch: '**/*.spec.ts',
  // Records the Chromium build and machine the run executes on (output/environment.json), which
  // the teardown stamps on the snapshot and the baseline selection keys on.
  globalSetup: './lib/setup.mjs',
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
