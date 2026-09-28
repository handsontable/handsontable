import { type Page } from '@playwright/test';

/**
 * How often `awaitBundle()` polls, in milliseconds. One constant, so the interval cannot drift
 * between page objects the way the inline copies did.
 */
export const BUNDLE_POLLING_MS = 100;

/**
 * Waits for the Handsontable bundle under test to have evaluated. Every page object's `goto()` calls
 * this right after `page.goto()`, before it asserts on anything the fixture rendered.
 *
 * A fixture's own readiness is not a substitute: the `document.write`-injected bundle script and the
 * block that builds the grid are separate, so a page can report ready while `Handsontable` is still
 * undefined. The spec then fails inside its first `page.evaluate()` with a bare
 * `Handsontable is not defined` – far from the cause, and only on a cold or busy server.
 *
 * Two choices in here are deliberate. `waitForFunction` rather than `expect`: `dist/handsontable.js`
 * is ~6 MB uncompressed and every worker pulls its own copy, so a cold or busy server outlasts the
 * 10s `expect` timeout, while `waitForFunction` polls against the test budget. And a timer interval
 * rather than the `requestAnimationFrame` default: parallel workers starve rAF callbacks, so the
 * default times out on a healthy page (3 mute `goto()` timeouts in ~700 runs of one spec, 0 once it
 * polled on a timer). `tests/.eslintrc.cjs` bans the default; this helper is where the interval lives.
 *
 * @param {Page} page The page the fixture is open on.
 */
export async function awaitBundle(page: Page): Promise<void> {
  await page.waitForFunction(() => 'Handsontable' in window, undefined, { polling: BUNDLE_POLLING_MS });
}
