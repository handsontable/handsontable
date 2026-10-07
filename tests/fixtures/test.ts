import { test as base, expect } from '@playwright/test';

/**
 * Shared test fixture for the functional E2E suite.
 *
 * Declares the `theme` and `bundle` options so every spec runs across the
 * same matrix the Puppeteer e2e suite covers: themes (main/horizon/classic)
 * × bundles (`umd` = dist/handsontable.js, `full-min` =
 * dist/handsontable.full.min.js — the same Handsontable builds the Puppeteer
 * `test:e2e` and `test:production` legs load; Puppeteer additionally loads
 * dist/languages/all.js, so an i18n spec's fixture must include that script
 * explicitly), via the projects in playwright.config.ts. A spec authored
 * against this `test` needs no theme or bundle awareness: it is parametrized
 * automatically by the active project, and the page objects append both to
 * the fixture URL.
 *
 * Formulas specs: the `umd` legs run the base bundle, which ships NO
 * HyperFormula — the plugin logs a warning and silently stays off. A formulas
 * fixture must load HyperFormula as an external script beside the bundle
 * (the DEV-2183 `formulas-grid.html` fixture is the reference), or the spec
 * fails mysteriously on the `umd` legs only.
 *
 * Import `test`/`expect` from here (not from `@playwright/test`) in every spec
 * so the options are available.
 */
export type TestOptions = {
  theme: string;
  bundle: string;
};

/**
 * The tag that puts a test on the engine legs as well: `e2e-firefox` and `e2e-webkit`, the projects of
 * `tests/playwright-engines.config.ts`, which run only tagged tests, on the main theme and the plain
 * UMD bundle. Tag a test whose behavior an engine could get wrong on its own (real key presses,
 * pointer gestures, focus, layout read back from the DOM), the way the cross-browser visual specs
 * used to cover it: `test.describe('…', { tag: CROSS_BROWSER_TAG }, () => { … })`.
 */
export const CROSS_BROWSER_TAG = '@cross-browser';

/**
 * The tag for a test that copies, cuts or pastes with a real Ctrl/Cmd+C, X or V. The `e2e-webkit`
 * project leaves these tests out. Playwright's WebKit takes the editing command for a shortcut
 * from the macOS key map alone, so on the Linux runner the key press reaches the page and nothing
 * is copied, cut or pasted (all three such tests failed there, on Playwright 1.62.1). Tag it beside
 * `CROSS_BROWSER_TAG`: `{ tag: [CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG] }`.
 */
export const CLIPBOARD_SHORTCUT_TAG = '@clipboard-shortcut';

export const test = base.extend<TestOptions>({
  theme: ['main', { option: true }],
  bundle: ['umd', { option: true }],
});

export { expect };
