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
  /*
   * Do NOT add {projectName} here: the golden records are keyed by this path in R2
   * (docs/base/<branch>/screenshots/**), so a change to the template re-keys every one of them.
   */
  snapshotPathTemplate: './tests/test-artifacts/screenshots/{testFilePath}/{arg}{ext}',
  /*
   * On CI a missing golden FAILS its test instead of being written and passed. Until DEV-2860 this
   * was Playwright's default 'missing' behind an actions/cache baseline that never restored from
   * develop, so a cache miss re-baselined the whole suite against whatever the preview rendered and
   * reported a green check — the false green that let 61 differences through on PR #13440 unrecorded.
   * A golden now comes from R2 and a page with none is reported as a new item for a human to accept.
   * Locally 'missing' stays: writing a golden for a page you just added is the point of running it.
   */
  updateSnapshots: isCI ? 'none' : 'missing',
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
    /*
     * The JSON report is what `tests/scripts/visual-manifest.mjs` turns into the reg-suit manifest the
     * core visual gate reads, so a docs run gets the same verdict, comment and approval as a core one.
     * CI only: locally the HTML report is the one anybody opens.
     */
    ...(isCI
      ? [['json', { outputFile: './tests/test-artifacts/report.json' }], ['github'], ['list']] as const
      : [['line']] as const),
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'off',
  },

  /*
   * Two projects over one testDir, so CI can run them apart: `visual` is the full-page screenshot
   * suite, which needs the R2 baseline and the approval gate and stays behind the `run-docs-visual`
   * label; `functional` is everything else in ./tests — assertions about the built pages that need no
   * golden and, until this split, only ever ran when someone applied that label. A bare
   * `npx playwright test` still runs both, which is what a local run wants.
   */
  projects: [
    {
      name: 'visual',
      testMatch: /visualDocs\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'functional',
      testIgnore: /visualDocs\.spec\.ts/,
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
