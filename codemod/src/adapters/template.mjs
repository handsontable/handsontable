/**
 * Cheap test on raw template text: does it mention the Handsontable package, a wrapper element or component, a
 * theme variable, or one of the class name families the migration rules look for. It is case-sensitive on the
 * short prefixes (`ht-`, `htCore`) so words such as `right-` or `height-` never match, and it deliberately does not
 * require the word "handsontable", because a page that only styles the grid rarely says it.
 */
export const TEMPLATE_PRECHECK = /--ht-|\bht-|\bht[A-Z]|[Hh]andsontable|hot-table|HotTable|HotColumn|hot-column|pika-/;

/**
 * An inline `<script>` element: its tag, no `src` attribute, and its text.
 */
const INLINE_SCRIPT = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\b[^>]*>/gi;

/**
 * Adapter for HTML templates: Angular component templates and plain pages. `parse` returns one read-only
 * `template` part whose `root` is `{ content }`, the same shape the Vue adapter gives its `<template>` block, and
 * whose line numbers are the file's own (`lineOffset` is `0`). The text is never parsed: a transform reads
 * `ctx.source` and reports. Inline `<script>` and `<style>` elements are not split into `js` and `css` parts, so
 * only rules that read raw template text reach them.
 *
 * `skipNotes` tells the runner about code the adapter cannot analyze: an inline `<script>` that mentions Handsontable.
 *
 * No transform rewrites a template in this release. A transform that does assigns the new text to
 * `root.content` and calls `markChanged()`, and `print` then returns it. A part that never changed prints the
 * original file, byte for byte.
 *
 * @type {import('../types.mjs').Adapter}
 */
const templateAdapter = {
  fileKind: 'template',
  fileKinds: ['template'],
  extensions: ['.html', '.htm'],
  implemented: true,
  precheck: TEMPLATE_PRECHECK,

  /**
   * Find the inline scripts that mention Handsontable. The tool reads no code inside an HTML page, so the page gets
   * one note, at the first such script.
   *
   * @param {string} source File text.
   * @returns {Array<{line: number, message: string}>} No note, or one.
   */
  skipNotes(source) {
    const lines = [...source.matchAll(INLINE_SCRIPT)]
      .filter(match => !/\bsrc\s*=/i.test(match[1]) && /handsontable/i.test(match[2]))
      .map(match => source.slice(0, match.index).split('\n').length);

    if (lines.length === 0) {
      return [];
    }

    return [{
      line: lines[0],
      message: `${lines.length === 1 ? 'An inline <script> that uses'
        : `${lines.length} inline <script> elements that use`} `
        + `Handsontable ${lines.length === 1 ? 'was' : 'were'} not analyzed. The tool reads no JavaScript inside an `
        + `HTML page. Check ${lines.length === 1 ? 'it' : 'them'} by hand.`,
    }];
  },

  /**
   * @param {string} source File text.
   * @returns {import('../types.mjs').ParseHandle} Handle with one `template` part.
   */
  parse(source) {
    return {
      parts: [{
        fileKind: 'template',
        source,
        root: { content: source },
        j: null,
        lineOffset: 0,
        changed: false,
      }],
    };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @param {string} source Original file text.
   * @returns {string} The new text when the part changed, otherwise the original text.
   */
  print(handle, source) {
    const [part] = handle.parts;

    return part.changed ? part.root.content : source;
  },
};

export default templateAdapter;
