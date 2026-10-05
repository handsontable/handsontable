import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';
import { CROSS_BROWSER_TAG, type TestOptions } from './fixtures/test';

/**
 * The engine legs: the specs tagged `@cross-browser` (`CROSS_BROWSER_TAG` in `fixtures/test.ts`) on
 * Firefox and WebKit. The six projects of `playwright.config.ts` run every spec on Chromium, under three
 * themes and two bundles; the engines run only the tagged ones, under the main theme and the plain UMD
 * bundle, because what a tagged spec asserts is the same under every theme and either bundle, and an
 * engine difference shows on one of each.
 *
 * A separate config, the way `visual-tests/playwright-cross-browser.config.ts` is, so that running
 * `playwright.config.ts` without `--project` never needs the two engines installed. Everything else —
 * the server and its port, the timeouts, the CI flake settings, the reporters (quarantine included) —
 * is inherited, so a flaky engine test reaches the ledger like any other. CI runs this config in one
 * job (`E2E / Playwright engines (Firefox, WebKit)` in `.github/workflows/e2e.yml`). Locally:
 *
 *   npx playwright install firefox webkit          # once, for the version in this package
 *   npx playwright test --config playwright-engines.config.ts e2e/<spec>.spec.ts
 */
export default defineConfig<TestOptions>({
  ...base,
  projects: [
    { name: 'e2e-firefox', device: 'Desktop Firefox' },
    { name: 'e2e-webkit', device: 'Desktop Safari' },
  ].map(({ name, device }) => ({
    name,
    testDir: 'e2e',
    grep: new RegExp(CROSS_BROWSER_TAG),
    use: { ...devices[device], theme: 'main', bundle: 'umd' },
  })),
});
