/**
 * Drops jsdom's `Could not parse CSS stylesheet` error for the theme `<style>`, for Jest only.
 *
 * `ThemeManager#injectThemeStyles` used to append the icon rules inside the theme's
 * `:where(.ht-theme-*) { ... }` variables block, which is native CSS nesting. jsdom 16 parses CSS
 * with cssom 0.4.4, which does not support nesting: it threw, dropped the whole sheet, and reported
 * the failure through `console.error` once per grid (about 1,000 times per run).
 *
 * Since icons became `<i class="ht-icon">` elements, the icon rules (`iconStyles()`) are written as
 * flat top-level rules after the block, so a default grid build no longer triggers the error. The
 * filter stays as a safeguard: if a nested rule lands in the theme block again, the noise stays out
 * of the test output, while the sheet being dropped is the state every unit test already runs in
 * (see `test/jsdomThemeVars.js`).
 *
 * Only that one error is dropped: the message must be jsdom's parse error AND the sheet text, which
 * jsdom passes as the second argument, must start with the theme block's own prefix. Any other
 * stylesheet that fails to parse is still reported.
 *
 * Like `test/jsdomThemeVars.js`, this file is registered in `jest.config.js` only and must not be
 * added to `ALLOWED_E2E_MODULES` in `.config/test-e2e.js`.
 */
const PARSE_ERROR = 'Error: Could not parse CSS stylesheet';
const THEME_BLOCK_PREFIX = ':where(.ht-theme-';

/**
 * Checks whether a `console.error` call is jsdom reporting the nested theme stylesheet.
 *
 * @param {Array} args The `console.error` arguments.
 * @returns {boolean}
 */
function isThemeStylesheetParseError(args) {
  const [stack, sheetText] = args;

  return typeof stack === 'string' && stack.startsWith(PARSE_ERROR) &&
    typeof sheetText === 'string' && sheetText.startsWith(THEME_BLOCK_PREFIX);
}

/**
 * Wraps a `console.error` implementation so it ignores jsdom's theme stylesheet parse error.
 *
 * @param {Function} error The `console.error` implementation to wrap.
 * @returns {Function}
 */
function withoutThemeStylesheetParseError(error) {
  return function(...args) {
    if (isThemeStylesheetParseError(args)) {
      return;
    }

    return error.apply(this, args);
  };
}

// eslint-disable-next-line no-console
console.error = withoutThemeStylesheetParseError(console.error);

module.exports = { isThemeStylesheetParseError, withoutThemeStylesheetParseError };
