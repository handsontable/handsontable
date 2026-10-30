import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

/**
 * The accessibility scan: `a11y/axe.spec.ts` runs axe-core over the pages of `a11y/pages.mjs` on
 * the three themes, and `reporters/a11y.ts` compares the findings with the committed baseline
 * (`a11y/axe-baseline.json`; policy in `tests/AGENTS.md`, "A11y: the axe scan and its baseline").
 *
 * A separate config with one project, the way the engines config is, rather than a project in
 * `playwright.config.ts`: that config's project list is pinned by `e2e/leg-declarations.spec.ts`
 * and `.github/scripts/__tests__/e2e-legs.test.mjs`, and the leg-declaration sweep reads every
 * spec under `e2e/`, so a scan that is not a functional test stays out of both. The server, its
 * port (`HOT_TEST_PORT`), the base URL and the trace settings are inherited. CI runs it as one
 * job, `A11y / axe` (`.github/workflows/a11y.yml`), which uploads `test-results/a11y/`.
 * Locally: `npm --prefix tests run test:a11y`, after building the UMD bundle and the minified
 * stylesheets (`tests/README.md`).
 */
export default defineConfig({
  ...base,
  testDir: 'a11y',
  // The checks beyond axe run under a config of their own, never this one, so the scan
  // collects its one spec only.
  testMatch: 'axe.spec.ts',
  outputDir: 'test-results/a11y',
  // A scan of a big fixture (the complex demo on a slow worker) takes longer than a functional
  // test; axe itself is a few seconds on such a page.
  timeout: 60_000,
  workers: process.env.CI ? 4 : undefined,
  // A scan is a measurement, not an assertion: a page that failed to load on the first attempt
  // and scanned on the second is a tooling hiccup, not a flake to fail the run on, and the scans
  // are not in the flake ledger (the artifact name differs from `playwright-report-*`).
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: false,
  // The a11y reporter stays LAST: the multiplexer keeps the status of the last reporter that
  // returns one, and that is what applies the mode. No quarantine reporter here: nothing is
  // quarantined in a scan, and it would fail a run that completed no test for its own reason.
  reporter: process.env.CI
    ? [['list'], ['./reporters/a11y.ts']]
    : [['list'], ['html', { outputFolder: 'playwright-report/a11y', open: 'never' }], ['./reporters/a11y.ts']],
  projects: [
    {
      name: 'a11y',
      testDir: 'a11y',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
