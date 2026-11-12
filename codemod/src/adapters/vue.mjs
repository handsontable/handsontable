/**
 * Adapter for Vue single-file components. This is a registered stub: `implemented` is `false`, so the runner
 * skips `.vue` files until the real adapter lands.
 *
 * The real adapter must follow the shared adapter interface:
 *
 * - `parse(source, filePath)` splits the file with `@vue/compiler-sfc` and returns `{ parts }` where each
 *   `<script>` block is a `js` part (with a jscodeshift `j` and `root`), each `<style>` block is a `css` part
 *   (postcss `root`), and `lineOffset` is the zero-based line where the block content starts. The template
 *   stays untouched, byte for byte, unless a `template` part is added later.
 * - `print(handle, source)` splices the printed text of every changed part back into the original file and
 *   leaves every other byte alone.
 *
 * @type {import('../types.mjs').Adapter}
 */
const vueAdapter = {
  fileKind: 'vue',
  fileKinds: ['vue', 'js', 'css', 'template'],
  extensions: ['.vue'],
  implemented: false,
  precheck: /handsontable|--ht-|\bht-/i,

  /**
   * @returns {never} Always throws, the adapter is not implemented.
   */
  parse() {
    throw new Error('The Vue adapter is not implemented yet.');
  },

  /**
   * @returns {never} Always throws, the adapter is not implemented.
   */
  print() {
    throw new Error('The Vue adapter is not implemented yet.');
  },
};

export default vueAdapter;
