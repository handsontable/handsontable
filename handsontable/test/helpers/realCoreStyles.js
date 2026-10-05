const CORE_STYLES_ID = 'handsontable-core-styles';

/**
 * Loads the real generated core stylesheet.
 *
 * The `.ts` extension is load-bearing: `jest.config.js` maps every import ending in
 * `/styles/handsontableStyles` to `test/__mocks__/coreStylesMock.js`, and this specifier does not
 * end that way, so it reaches the real file. That file is gitignored and written by
 * `build:styles`, which `npm run test:unit` runs first; a bare `jest` run on a clean checkout has
 * no such file, so the failure names the command that creates it.
 *
 * @returns {string}
 */
function loadRealCoreStyles() {
  try {
    // eslint-disable-next-line global-require
    return require('../../src/styles/handsontableStyles.ts').default;

  } catch (error) {
    throw new Error(
      '`injectRealCoreStyles()` needs the generated `src/styles/handsontableStyles.ts`. ' +
      'Run `npm run build:styles` in `handsontable/` (or use `npm run test:unit`, which runs it first).',
      { cause: error }
    );
  }
}

/**
 * Injects the real core stylesheet into the document, for the Jest specs that depend on it.
 *
 * `StylesHandler` skips its own injection when an element with the core styles id already exists,
 * so every grid built after this call uses the real rules instead of the Jest stub. Each of those
 * grids pays the slower jsdom style resolution the stub exists to avoid, so scope it as tightly as
 * the spec allows: call it inside the one test that needs it, or in `beforeEach()`/`beforeAll()`
 * only when every grid in that block needs it. Undo it with `removeRealCoreStyles()` in the
 * matching `afterEach()`/`afterAll()`.
 */
export function injectRealCoreStyles() {
  const realCoreStyles = loadRealCoreStyles();
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
