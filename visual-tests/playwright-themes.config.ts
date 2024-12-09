import { PlaywrightTestConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * Https://github.com/motdotla/dotenv.
 */
// require('dotenv').config();

const VIEWPORT_SIZE = { width: 1920, height: 1100 };

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const config: PlaywrightTestConfig = {
  testDir: './tests/themes',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`.
     */
    timeout: 10000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8085',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run serve-example-themes',
    port: 8085,
    reuseExistingServer: !process.env.CI,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT_SIZE,
        contextOptions: {
          // chromium-specific permissions
          permissions: ['clipboard-read', 'clipboard-write'],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: VIEWPORT_SIZE,
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: VIEWPORT_SIZE,
      },
    },
  ]
};

export default config;
