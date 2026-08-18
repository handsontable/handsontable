import { test, expect } from '../fixtures/test';
import { HiddenInitPage } from '../fixtures/pages/HiddenInitPage';

/**
 * Regression guard for destroying a grid that was initialized inside a hidden
 * container (DEV-2210).
 *
 * Core registers `observeVisibilityChangeOnce(rootElement, …)` when the root
 * element has no `offsetParent` at first init. An IntersectionObserver entry
 * carries the state at snapshot time, so a snapshot taken while the element was
 * visible could be delivered AFTER `destroy()` — and the callback then read
 * `instance.view` on `null`, throwing `Cannot read properties of null (reading
 * 'view')` from library code. In CI that killed the whole Puppeteer suite,
 * because `run-puppeteer.mjs` treats any `pageerror` as fatal.
 *
 * The fix disconnects the observer at the top of `destroy()` and guards the
 * callback. This spec asserts the absence of the crash, not observer internals,
 * so it holds whichever half of the fix catches the delivery.
 */
test.describe('grid initialized in a hidden container', () => {
  test('destroying it inside the visibility-observer delivery window throws nothing', async ({
    page, theme, bundle,
  }) => {
    const pageErrors: Error[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    const grid = new HiddenInitPage(page, theme, bundle);

    await grid.goto();
    await grid.runDestroyRace();

    // The marker is written five frames after `destroy()`, so a late delivery
    // has already been handled (or already thrown) by the time this resolves.
    await grid.expectSettled();

    // Proves the hidden-init branch was actually taken — without it the whole
    // scenario could silently degrade to "destroy a visible grid" and pass.
    expect(await grid.wasHiddenAtInit()).toBe(true);

    expect(pageErrors).toEqual([]);
  });
});
