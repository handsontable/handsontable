import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { checksForRun } from './lib/a11y-evidence.mjs';
import { siteChecks, siteOf, siteOutputDir } from './lib/a11y-site-checks.mjs';
import { docsBaseUrl } from './a11y/docs/pages.mjs';

/**
 * The checks beyond axe on a deployed site: one project per check of `SITE_CHECKS` (`lib/a11y-site-checks.mjs`)
 * for the site `HOT_A11Y_SITE` names (`docs` when unset), each a spec under `a11y/sites/`, and the checks reporter
 * (`reporters/a11y-checks.ts`) merging what each test attached into one evidence document per check, in the
 * site's own folder (`test-results/a11y-<site>-checks/<check>.json`). Policy: `tests/AGENTS.md`, "A11y: the site
 * checks beyond axe".
 *
 * A config of its own, like the docs site scan's: it needs no fixture server and no Handsontable build, because it
 * reads a deployed site (the docs: `DOCS_A11Y_BASE_URL`, the develop staging deploy by default). `A11Y_CHECKS`
 * (comma-separated check ids) runs a subset, as on the product checks. Service workers are blocked, so every
 * request a page makes goes through the routing a check sets up. Report-only: the reporter never changes the
 * run's status, and a red run is a tooling failure. CI runs it from `.github/workflows/docs-a11y.yml`. Locally:
 * `npm --prefix tests run test:a11y-sites`, `-- --project=docs-keyboard` for one check.
 */
const TESTS_ROOT = path.dirname(fileURLToPath(import.meta.url));
const site = siteOf(process.env.HOT_A11Y_SITE);
const checks = siteChecks(site);
const outputDir = siteOutputDir(site);
// The deploy the run reads, which every document records (`run.baseUrl`): the findings ledger keeps a docs run of the
// develop staging deploy only.
const baseUrl = { docs: () => docsBaseUrl(process.env.DOCS_A11Y_BASE_URL) }[site]();

export default defineConfig({
  testDir: 'a11y/sites',
  outputDir,
  // A walk of a long page (the API reference) presses Tab a thousand times, reading each stop's role and name.
  timeout: 300_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  forbidOnly: !!process.env.CI,
  // A measurement, not an assertion: a page that failed to load once and measured on the retry is recorded as
  // flaky in the document (a finding against the check), never a red run.
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: false,
  reporter: [
    ['list'],
    ...(process.env.CI ? [] : [['html', { outputFolder: `playwright-report/a11y-${site}-checks`, open: 'never' }] as const]),
    ['./reporters/a11y-checks.ts', { checks, outputDir: path.join(TESTS_ROOT, outputDir), baseUrl }],
  ],
  use: {
    trace: 'off',
    serviceWorkers: 'block',
  },
  projects: checksForRun(process.env, checks).map(name => ({
    name,
    testMatch: checks[name].spec,
    use: { ...devices['Desktop Chrome'] },
  })),
});
