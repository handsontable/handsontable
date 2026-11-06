import { defineConfig, devices } from '@playwright/test';

/**
 * The docs site scan: `a11y/docs/docs-axe.spec.ts` runs axe-core over the pages of
 * `a11y/docs/pages.mjs` in the light and dark color schemes, and `reporters/a11y.ts` (with
 * `suite: 'docs'`) compares the findings with the committed `a11y/docs/docs-baseline.json`. Policy:
 * `tests/AGENTS.md`, "A11y: the docs site scan".
 *
 * A config of its own rather than a project of the fixture scan's: it needs no fixture server and no
 * Handsontable build, because it reads a deployed docs site (`DOCS_A11Y_BASE_URL`, the staging deploy of
 * develop by default; a pull request's preview or `http://localhost:4321/docs` for a local
 * `npm --prefix docs run preview`). CI runs it from `.github/workflows/docs-a11y.yml`, which uploads
 * `test-results/a11y-docs/`. Locally: `npm --prefix tests run test:a11y-docs`.
 */
export default defineConfig({
  testDir: 'a11y/docs',
  testMatch: 'docs-axe.spec.ts',
  outputDir: 'test-results/a11y-docs',
  // A docs page loads its examples (Angular and Vue take seconds to bootstrap) and the scan reads the
  // whole document, a long page's included: the Core API reference takes about a minute in CI before
  // its screenshot, so the budget leaves it room.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  forbidOnly: !!process.env.CI,
  // A scan is a measurement: a page that failed to load once and scanned on the retry is a network
  // hiccup, not a flake to fail the run on (the artifact is outside the flake ledger's glob).
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: false,
  // The a11y reporter stays last: it applies the mode and owns the run's status.
  reporter: process.env.CI
    ? [['list'], ['./reporters/a11y.ts', { suite: 'docs' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report/a11y-docs', open: 'never' }], ['./reporters/a11y.ts', { suite: 'docs' }]],
  use: {
    trace: 'off',
  },
  projects: [
    {
      name: 'a11y-docs',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
