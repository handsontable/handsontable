/**
 * Adapter for the stylesheet languages the tool has no parser for: Less, Stylus, and the indented Sass syntax. It
 * never parses a file. `transformFile` asks it only for `skipReason`: a file that mentions a theme variable or
 * Handsontable gets one `skipped-file` warning, because the tool cannot rename or report anything inside it, and
 * every other file of these types is left alone without a word.
 *
 * @type {import('../types.mjs').Adapter}
 */
const unsupportedStyleAdapter = {
  fileKind: 'skipped',
  fileKinds: [],
  extensions: ['.less', '.styl', '.stylus', '.sass'],
  implemented: true,
  precheck: /--ht-|\bht-|[Hh]andsontable|\.pika-/,
  skipReason: 'The tool reads CSS and SCSS only, so this Less, Stylus, or Sass file was not analyzed. '
    + 'Search it for --ht- variables and Handsontable selectors by hand.',

  /**
   * @returns {import('../types.mjs').ParseHandle} Never called: the runner stops at `skipReason`.
   */
  parse() {
    return { parts: [] };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @param {string} source Original file text.
   * @returns {string} The original text.
   */
  print(handle, source) {
    return source;
  },
};

export default unsupportedStyleAdapter;
