/**
 * Adapter for HTML and framework templates (Angular `.html`). This is a registered stub: `implemented` is
 * `false`, so the runner skips these files until the real adapter lands.
 *
 * The real adapter must follow the shared adapter interface: `parse(source, filePath)` returns `{ parts }` with
 * one `template` part whose `root` is whatever the template transforms document, and `print(handle, source)`
 * returns the whole file with every untouched byte preserved.
 *
 * @type {import('../types.mjs').Adapter}
 */
const templateAdapter = {
  fileKind: 'template',
  fileKinds: ['template'],
  extensions: ['.html'],
  implemented: false,
  precheck: /handsontable|hot-?table/i,

  /**
   * @returns {never} Always throws, the adapter is not implemented.
   */
  parse() {
    throw new Error('The template adapter is not implemented yet.');
  },

  /**
   * @returns {never} Always throws, the adapter is not implemented.
   */
  print() {
    throw new Error('The template adapter is not implemented yet.');
  },
};

export default templateAdapter;
