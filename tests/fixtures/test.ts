import { test as base, expect } from '@playwright/test';
import type { Bundle } from './bundle';

/**
 * Shared test fixture for the functional E2E suite.
 *
 * Declares the `theme` and `bundle` options so a spec can run across the
 * same matrix the Puppeteer e2e suite covers: themes (main/horizon/classic)
 * × bundles (`umd` = dist/handsontable.js, `full-min` =
 * dist/handsontable.full.min.js — the same Handsontable builds the Puppeteer
 * `test:e2e` and `test:production` legs load; Puppeteer additionally loads
 * dist/languages/all.js, so an i18n spec's fixture must include that script
 * explicitly), via the projects in playwright.config.ts. A spec authored
 * against this `test` is parametrized by the active project, and the page
 * objects append both to the fixture URL; WHICH projects run it is what its
 * leg tags declare (`THEMES_TAG` / `BUNDLES_TAG` below): none means
 * `e2e-main` only.
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
  bundle: Bundle;
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
 * The tag for a test that runs a text field's editing command on a real shortcut: copies, cuts or
 * pastes with Ctrl/Cmd+C, X or V, or undoes and redoes inside an open editor with Ctrl/Cmd+Z. The
 * `e2e-webkit` project leaves these tests out. Playwright's WebKit takes the editing command for a
 * shortcut from the macOS key map alone, so on the Linux runner the key press reaches the page and
 * nothing is copied, cut, pasted or undone (all three clipboard tests failed there, on Playwright
 * 1.62.1). Tag it beside `CROSS_BROWSER_TAG`: `{ tag: [CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG] }`.
 */
export const CLIPBOARD_SHORTCUT_TAG = '@clipboard-shortcut';

/**
 * The leg tags: which legs of the theme × bundle matrix a spec runs on. No tag is `e2e-main` only
 * (plain UMD, the main theme). `THEMES_TAG` adds `e2e-horizon` and `e2e-classic`, `BUNDLES_TAG` adds
 * `e2e-main-min`, and both together add `e2e-horizon-min` and `e2e-classic-min`. A tag goes on EVERY
 * top-level block of the spec, in one `{ tag: … }` array with the engine tags above when a spec
 * carries those too; a static sweep (`lib/__tests__/leg-declarations.test.mjs`) refuses a spec that
 * touches theme or bundle surface without the tag, and the nightly runs the full matrix regardless.
 * Defined in `lib/leg-declarations.mjs`, where the config's greps read them from. See
 * `tests/AGENTS.md`, "Declaring the legs".
 */
export { THEMES_TAG, BUNDLES_TAG } from '../lib/leg-declarations.mjs';

/**
 * The tag for a test that checks a motion the classic theme never runs, because the theme sets
 * `--ht-table-transition` to `0s`. The `e2e-classic` projects leave these tests out, so the classic
 * legs do not repeat them on another theme. Check the classic theme's instant switch in a test
 * without it: `test.describe('…', { tag: [THEMES_TAG, MOTION_TAG] }, () => { … })`.
 */
export const MOTION_TAG = '@motion';

export const test = base.extend<TestOptions>({
  theme: ['main', { option: true }],
  bundle: ['umd', { option: true }],
});

export { expect };
