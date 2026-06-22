import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: './tests/.env' });

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL ?? 'http://localhost:4321/docs';

export default defineConfig({
  expect: { timeout: 60000 },
  timeout: 60000,
  testDir: './tests',
  outputDir: './tests/test-artifacts/output',
  snapshotPathTemplate: './tests/test-artifacts/screenshots/{testFilePath}/{arg}{ext}',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  /* Retry on CI only */
  retries: isCI ? 3 : 0,
  /*
   * The CI runner (ubuntu-latest) has far fewer cores than a dev machine. With 8
   * workers, heavy doc pages (6-9 Handsontable grids, each running a sequential
   * bootstrap + autoRowSize RAF settle loop) oversubscribe the CPU: loading overlays
   * clear too slowly (line-93 wait) and the screenshot-stability loop never quiesces
   * within the per-test timeout. Cap CI at 4 workers to match the runner and keep the
   * suite well under the 90-minute job cap; keep 8 locally for speed.
   */
  workers: isCI ? 4 : 8,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', {
      outputFolder: './tests/test-artifacts/results',
      open: 'never',
    }],
    ...(isCI ? [['github'], ['list']] as const : [['line']] as const),
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'off',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: !baseURL || baseURL.includes('localhost') ? {
    command: 'pnpm preview',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 300 * 1000,
  } : undefined,
});
