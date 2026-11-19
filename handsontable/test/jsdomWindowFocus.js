/**
 * Replaces jsdom's `window.focus` with a silent no-op, for Jest only.
 *
 * jsdom defines `window.focus` but does not implement it: every call reports
 * `Error: Not implemented: window.focus` through `console.error`. `TableView` calls
 * `rootWindow.focus()` on every mousedown inside the grid, so that a grid inside an iframe takes
 * the window focus. A spec that dispatches a mousedown on a cell got one such error per click.
 *
 * The replacement does nothing either, so no test sees a different focus than before. A spec that
 * needs to assert the call can still `jest.spyOn(window, 'focus')`.
 *
 * Registered in `jest.config.js` only, for the reason `jsdomWindowScroll.js` gives.
 */
beforeAll(() => {
  // A `@jest-environment node` spec file has no `window`; this is a no-op there.
  if (typeof window === 'undefined') {
    return;
  }

  window.focus = () => {};
});
