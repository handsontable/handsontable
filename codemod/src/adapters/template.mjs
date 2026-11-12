/**
 * Cheap test on raw template text: does it mention the Handsontable package, a wrapper element or component, a
 * theme variable, or one of the class name families the migration rules look for. It is case-sensitive on the
 * short prefixes (`ht-`, `htCore`) so words such as `right-` or `height-` never match, and it deliberately does not
 * require the word "handsontable", because a page that only styles the grid rarely says it.
 */
export const TEMPLATE_PRECHECK = /--ht-|\bht-|\bht[A-Z]|[Hh]andsontable|hot-table|HotTable|HotColumn|hot-column|pika-/;

/**
 * Adapter for HTML templates: Angular component templates and plain pages. `parse` returns one read-only
 * `template` part whose `root` is `{ content }`, the same shape the Vue adapter gives its `<template>` block, and
 * whose line numbers are the file's own (`lineOffset` is `0`). The text is never parsed: a transform reads
 * `ctx.source` and reports. Inline `<script>` and `<style>` elements are not split into `js` and `css` parts, so
 * only rules that read raw template text reach them.
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
