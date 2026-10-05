import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';
import { CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG, type TestOptions } from './fixtures/test';

/**
 * The engine legs: the specs tagged `@cross-browser` (`CROSS_BROWSER_TAG` in `fixtures/test.ts`) on
 * Firefox and WebKit. The six projects of `playwright.config.ts` run every spec on Chromium, under three
 * themes and two bundles; the engines run only the tagged ones, under the main theme and the plain UMD
 * bundle, because what a tagged spec asserts is the same under every theme and either bundle, and an
 * engine difference shows on one of each.
 *
 * WebKit also leaves out the tests tagged `@clipboard-shortcut` (`CLIPBOARD_SHORTCUT_TAG`): on the
 * Linux runner Playwright's WebKit turns a real Ctrl+C, X or V into no copy, cut or paste at all.
 * They are left out on every platform, so a local run and CI run the same tests.
 *
 * A separate config, the way `visual-tests/playwright-cross-browser.config.ts` is, so that running
 * `playwright.config.ts` without `--project` never needs the two engines installed. Everything else
 * (the server and its port, the timeouts, the CI flake settings, the reporters, quarantine included)
 * is inherited, so a flaky engine test reaches the ledger like any other. CI runs this config in one
 * job (`E2E / Playwright engines (Firefox, WebKit)` in `.github/workflows/e2e.yml`). Locally:
 *
 *   npx playwright install firefox webkit          # once, for the version in this package
 *   npx playwright test --config playwright-engines.config.ts e2e/<spec>.spec.ts
 */
const engine = (name: string, device: string) => ({
  name,
  testDir: 'e2e',
  grep: new RegExp(CROSS_BROWSER_TAG),
  use: { ...devices[device], theme: 'main', bundle: 'umd' },
});

export default defineConfig<TestOptions>({
  ...base,
  projects: [
    engine('e2e-firefox', 'Desktop Firefox'),
    { ...engine('e2e-webkit', 'Desktop Safari'), grepInvert: new RegExp(CLIPBOARD_SHORTCUT_TAG) },
  ],
});
