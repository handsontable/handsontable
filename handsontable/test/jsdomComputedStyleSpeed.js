/**
 * Skips an O(n^2) string build in jsdom's `getComputedStyle`, for Jest only.
 *
 * `cssstyle@2.3.0` ends every `CSSStyleDeclaration#_setProperty` call with
 * `this._onChange(this.cssText)`. The `cssText` getter walks all the properties set so far and joins
 * them into one string, and it is evaluated before the callback is even looked at. `getComputedStyle`
 * copies every property of every matching rule into a fresh declaration, one `setProperty` at a time,
 * and that declaration has no change callback (its default `_onChange` is an empty function). So each
 * computed-style read built `cssText` once per copied property, for nothing. A grid reads computed
 * style for an element and each of its ancestors (`isVisible`, `getTrimmingContainer`,
 * `getScrollableElement`), a few hundred times per render, which made about 60% of the CPU time of
 * the grid-heavy suites (`sheetsBar.unit.js`, `undoRedo.unit.js`) land in `cssstyle`.
 *
 * The replacement does what `_setProperty` does, minus the `_onChange` call, and only for a
 * declaration whose callback is cssstyle's own empty default. A declaration with a real callback,
 * such as `element.style`, which writes the `style` attribute through it, runs the original code. No
 * test sees a different value.
 *
 * The patch copies a body of a third-party function, so it applies only when `_setProperty` still has
 * the exact source it was written against. After a `cssstyle` upgrade that changes it, the patch
 * stays off and `test/__tests__/jsdomComputedStyleSpeed.unit.js` fails, which says to re-derive it.
 *
 * Like `test/jsdomWindowScroll.js`, it is registered in `jest.config.js` only and must not be added to
 * `ALLOWED_E2E_MODULES` in `.config/test-e2e.js`: the Jasmine Puppeteer suite runs in a real Chrome,
 * where there is no `cssstyle`.
 */
const { patchCssStyleDeclaration } = require('./helpers/cssStyleDeclarationPatch');

// A `@jest-environment node` spec file has no `window`; this is a no-op there.
if (typeof window !== 'undefined') {
  patchCssStyleDeclaration(window.CSSStyleDeclaration);
}
