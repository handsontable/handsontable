import { defineConfig, devices } from '@playwright/test';

/**
 * The website scan: `a11y/website/website-axe.spec.ts` runs axe-core over the pages of `a11y/website/pages.mjs` on
 * production handsontable.com at the phone and the desktop width, and `reporters/a11y.ts` (with `suite: 'website'`)
 * compares the findings with the committed `a11y/website/website-baseline.json`. Policy: `tests/AGENTS.md`, "A11y: the
 * website scan".
 *
 * A config of its own, like the docs scan's: it reads a deployed site (`WEBSITE_A11Y_BASE_URL`, production by default),
 * so it needs no fixture server and no Handsontable build. Service workers are blocked, so every request goes through
 * the guard that keeps a form submit or a booking from leaving the page (`a11y/website/website-site.ts`). CI runs it
 * from `.github/workflows/website-a11y.yml`. Locally: `npm --prefix tests run test:a11y-website`.
 */
export default defineConfig({
  testDir: 'a11y/website',
  testMatch: 'website-axe.spec.ts',
  outputDir: 'test-results/a11y-website',
  // A page hydrates its islands, quiets its network and holds still before the scan; a demo page loads a grid.
  timeout: 150_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  forbidOnly: !!process.env.CI,
  // A scan is a measurement: a page that failed to load once and scanned on the retry is a network hiccup.
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: false,
  // The a11y reporter stays last: it applies the mode and owns the run's status.
  reporter: process.env.CI
    ? [['list'], ['./reporters/a11y.ts', { suite: 'website' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report/a11y-website', open: 'never' }], ['./reporters/a11y.ts', { suite: 'website' }]],
  use: {
    trace: 'off',
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'a11y-website',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
