/**
 * Replaces the test DOM's `window.scrollTo` with a silent no-op, for Jest only.
 *
 * warpdom, like jsdom, defines `window.scrollTo` but does not implement it: every call does nothing
 * and reports a `Not implemented` error through `console.error`. It has no layout, so the window
 * owns the scroll axes of every grid built in a unit test, and Walkontable's
 * `TopOverlay`/`InlineStartOverlay#setScrollPosition` call `rootWindow.scrollTo()` whenever a
 * selection scrolls the viewport. That was about 230 errors per run.
 *
 * The replacement does nothing either, so no test sees a different scroll position than before.
 * A spec that needs to assert the call can still `jest.spyOn(window, 'scrollTo')`.
 *
 * It cannot live in `test/bootstrap.js` the way the `scrollIntoView` stub does: bootstrap is bundled
 * into the Jasmine Puppeteer suite (`ALLOWED_E2E_MODULES` in `.config/test-e2e.js`), and the test
 * DOM's `scrollTo` exists, so a `??` guard would never replace it while an unconditional assignment
 * would break real scrolling in Chrome. Registered in `jest.config.js` only.
 */
beforeAll(() => {
  // A `@jest-environment node` spec file has no `window`; this is a no-op there.
  if (typeof window === 'undefined') {
    return;
  }

  window.scrollTo = () => {};
});
