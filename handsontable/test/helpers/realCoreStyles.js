// The `.ts` extension is load-bearing: `jest.config.js` maps every import ending in
// `/styles/handsontableStyles` to `test/__mocks__/coreStylesMock.js`, and this specifier does not
// end that way, so it reaches the real generated stylesheet.
import realCoreStyles from '../../src/styles/handsontableStyles.ts';

const CORE_STYLES_ID = 'handsontable-core-styles';

/**
 * Injects the real core stylesheet into the document, for the Jest specs that depend on it.
 *
 * `StylesHandler` skips its own injection when an element with the core styles id already exists,
 * so every grid built after this call uses the real rules instead of the Jest stub. Call it in
 * `beforeAll()` and undo it with `removeRealCoreStyles()` in `afterAll()`, because each grid in
 * that file pays the slower jsdom style resolution the stub exists to avoid.
 */
export function injectRealCoreStyles() {
  const existing = document.getElementById(CORE_STYLES_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement('style');

  style.id = CORE_STYLES_ID;
  style.textContent = realCoreStyles;
  document.head.appendChild(style);
}

/**
 * Removes the core stylesheet that `injectRealCoreStyles()` added.
 */
export function removeRealCoreStyles() {
  document.getElementById(CORE_STYLES_ID)?.remove();
}
