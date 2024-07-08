import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: './tests/.env' });

const isCI = !!process.env.CI;

export default defineConfig({
  expect: { timeout: !process.env.BASE_URL || process.env.BASE_URL.includes('localhost') ? 30000 : 60000 },
  timeout: !process.env.BASE_URL || process.env.BASE_URL.includes('localhost') ? 30000 : 60000,
  testDir: './tests',
  outputDir: './tests/test-artifacts/output',
  snapshotPathTemplate: './tests/test-artifacts/screenshots/{testFilePath}/{arg}{ext}',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 8,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', {
      outputFolder: './tests/test-artifacts/results',
      open: 'never',
    }],
    isCI ? ['github'] : ['line'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080/docs',
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
  webServer: !process.env.BASE_URL || process.env.BASE_URL.includes('localhost') ? {
    command: 'npm run docs:serve',
    url: process.env.BASE_URL ?? 'http://localhost:8080/docs',
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
  } : undefined,
});
