import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';
import { EVIDENCE_CHECKS, checksForSuite } from './lib/a11y-evidence.mjs';

/**
 * The accessibility checks beyond axe: one project per check, each a spec under `a11y/checks/`, and
 * `reporters/a11y-checks.ts` merging what each test attached into one evidence document per check
 * (`test-results/a11y-checks/<check>.json`; policy in `tests/AGENTS.md`, "A11y: the checks beyond
 * axe"). The projects are the checks of `EVIDENCE_CHECKS` in `lib/a11y-evidence.mjs`, one each, named by
 * the check: `HOT_A11Y_CHECKS_SUITE=pull-request` keeps the ones that run on pull requests, `nightly` or
 * no value keeps them all (`checksForSuite()`).
 *
 * A separate config, the way the axe scan's is: the e2e config's project list is pinned by
 * `e2e/leg-declarations.spec.ts` and `.github/scripts/__tests__/e2e-legs.test.mjs`, and the
 * leg-declaration sweep reads every spec under `e2e/`. The server, its port (`HOT_TEST_PORT`), the base
 * URL and the trace settings are inherited. Report-only: the reporter never changes the run's status,
 * a red run is a tooling failure, and the CI job carries `continue-on-error`. Locally:
 * `npm --prefix tests run test:a11y-checks` after `build:umd`, `build:styles.min` and
 * `build:themes-css.min`; `-- --project=<check>` runs one check.
 */
export default defineConfig({
  ...base,
  testDir: 'a11y/checks',
  outputDir: 'test-results/a11y-checks',
  // A check walks a page with real keys or measures it in several steps: seconds, not a functional
  // test's fraction of one. The documented-shortcuts test presses about a hundred probes on one page.
  timeout: 120_000,
  workers: process.env.CI ? 4 : undefined,
  // A measurement, not an assertion: a page that failed to load on the first attempt and measured on
  // the second is recorded as flaky in the document (a finding against the check), never a red run.
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: false,
  // No quarantine reporter: nothing is quarantined in a check. The checks reporter writes the documents.
  reporter: process.env.CI
    ? [['list'], ['./reporters/a11y-checks.ts']]
    : [['list'], ['html', { outputFolder: 'playwright-report/a11y-checks', open: 'never' }], ['./reporters/a11y-checks.ts']],
  projects: checksForSuite(process.env.HOT_A11Y_CHECKS_SUITE).map(name => ({
    name,
    testMatch: EVIDENCE_CHECKS[name].spec,
    use: { ...devices['Desktop Chrome'] },
  })),
});
