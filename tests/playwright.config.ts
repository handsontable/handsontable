import { defineConfig, devices } from '@playwright/test';
import type { TestOptions } from './fixtures/test';

/**
 * One Playwright config for the whole package. Functional E2E lives in `e2e/`,
 * visual regression in `visual/` (populated during the visual milestone). The
 * two are separated by projects so each can carry its own settings — e2e is
 * flake-strict, visual will add screenshot tolerances and masks.
 *
 * Theme coverage: the functional suite runs once per theme (main/horizon/
 * classic) via one project each, mirroring the Puppeteer e2e theme matrix.
 * Every spec is parametrized automatically — authors write one spec and it
 * runs under all themes. CI runs one job per theme (a `theme` matrix over
 * `--project=e2e-<theme>`); locally, `npx playwright test` runs all themes and
 * `--project=e2e-horizon` runs one.
 *
 * Version parity rule: `@playwright/test` here and the CI container image
 * (`mcr.microsoft.com/playwright:v<same>-noble`) bump together, never apart, so
 * local, CI, and baseline generation render identically.
 */
const E2E_THEMES = ['main', 'horizon', 'classic'] as const;

export default defineConfig<TestOptions>({
  testDir: '.',
  timeout: 20_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // A test that only passes on retry is a hard failure pre-merge.
  failOnFlakyTests: !!process.env.CI,
  // CI: html (open:never) — it is what the failure-artifact upload collects
  // (tests/playwright-report) — plus GitHub annotations. Blob is only for
  // sharded runs, which this suite does not use.
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
  use: {
    baseURL: 'http://localhost:8123',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  // Serves the repo root so the fixture page can load the built handsontable
  // dist and styles. cwd defaults to this config's directory (`tests/`).
  webServer: {
    command: 'node support/static-server.mjs',
    port: 8123,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    // One functional project per theme — the destination for any new e2e spec.
    // The `theme` option flows to the page objects, which load the matching
    // theme stylesheet in the fixture.
    ...E2E_THEMES.map(theme => ({
      name: `e2e-${theme}`,
      testDir: 'e2e',
      use: { ...devices['Desktop Chrome'], theme },
    })),
    // Visual regression project — destination for the visual suite (milestone 2/3).
    // {
    //   name: 'visual-chromium',
    //   testDir: 'visual',
    //   use: { ...devices['Desktop Chrome'] },
    //   expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
    // },
  ],
});
