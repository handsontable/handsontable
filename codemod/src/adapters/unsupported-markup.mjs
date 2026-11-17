/**
 * Adapter for the component and document formats that embed styles or scripts and have no reader here: Svelte, Astro,
 * and MDX. It never parses a file. `transformFile` asks it only for `skipReason`: a file that mentions a theme
 * variable or Handsontable gets one `skipped-file` warning, because the tool cannot rename or report anything inside
 * it, and every other file of these types is left alone without a word.
 *
 * @type {import('../types.mjs').Adapter}
 */
const unsupportedMarkupAdapter = {
  fileKind: 'skipped',
  fileKinds: [],
  extensions: ['.svelte', '.astro', '.mdx'],
  implemented: true,
  precheck: /--ht-|\bht-|[Hh]andsontable|\.pika-/,
  skipReason: 'The tool does not read Svelte, Astro, or MDX files, so this file was not analyzed. Search its '
    + '<style> blocks, scripts, and code fences for --ht- variables, Handsontable selectors, and Handsontable code by '
    + 'hand.',

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

export default unsupportedMarkupAdapter;
