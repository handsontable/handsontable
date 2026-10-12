import { type Page } from '@playwright/test';

/**
 * How often `awaitBundle()` polls, in milliseconds. One constant, so the interval cannot drift
 * between page objects the way the inline copies did.
 */
export const BUNDLE_POLLING_MS = 100;

/**
 * The bundle a leg runs, as the `bundle` option and every fixture's `?bundle=` allowlist spell it:
 * `umd` is `dist/handsontable.js`, `full-min` is `dist/handsontable.full.min.js`.
 */
export type Bundle = 'umd' | 'full-min';

/**
 * What the fixture contract's `?theme=`/`?bundle=` block (copied from `demo/grid.html`) throws for a
 * value outside its allowlist.
 */
const FIXTURE_PARAM_ERROR = /^Unknown \?(theme|bundle)= value: /;

/**
 * Waits for the Handsontable bundle under test to have evaluated. Every page object's `goto()` calls
 * this right after `page.goto()`, before it asserts on anything the fixture rendered.
 *
 * A fixture's own readiness is not a substitute: the `document.write`-injected bundle script and the
 * block that builds the grid are separate, so a page can report ready while `Handsontable` is still
 * undefined. The spec then fails inside its first `page.evaluate()` with a bare
 * `Handsontable is not defined` – far from the cause, and only on a cold or busy server.
 *
 * A fixture that rejected its `?theme=` or `?bundle=` threw in `<head>` before it wrote the bundle
 * script, so the bundle never arrives. That throw happened during `page.goto()`, and this rethrows it
 * up front: otherwise a page object passing a bad value (a fixture name in the bundle slot) ends as a
 * bare test timeout inside the wait below, with nothing pointing at the cause.
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
  const paramError = (await page.pageErrors({ filter: 'since-navigation' }))
    .find(error => FIXTURE_PARAM_ERROR.test(error.message));

  if (paramError) {
    throw new Error(`The fixture rejected its query params, so no bundle loads (${page.url()}):\n${paramError.message}`);
  }

  await page.waitForFunction(() => 'Handsontable' in window, undefined, { polling: BUNDLE_POLLING_MS });
}

/**
 * Waits for the fixture's inline script to have built the grid (`window.hot`) and rethrows the constructor error
 * the fixture captured in `window.htBuildError`, so a bad setting is a red test with the cause, not a mute
 * timeout. Call it right after `awaitBundle()`.
 *
 * @param {Page} page The page the fixture is open on.
 */
export async function awaitFixtureBuilt(page: Page): Promise<void> {
  await page.waitForFunction(
    () => 'hot' in window || 'htBuildError' in window,
    undefined,
    { polling: BUNDLE_POLLING_MS }
  );

  const buildError = await page.evaluate(() => (window as { htBuildError?: string }).htBuildError ?? null);

  if (buildError !== null) {
    throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
  }
}
