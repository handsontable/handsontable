import { JsonDocument, detectIndent } from '../lib/json-edit.mjs';

export { detectIndent };

/**
 * Adapter for JSON, in practice `package.json`. The whole file is one `json` part whose `root` is the parsed
 * value, for reading. A transform changes the file through `part.json` (a `JsonDocument`, see `lib/json-edit.mjs`),
 * which edits the text by offset and keeps `root` in step. Printing returns that text, so every byte outside an
 * edited value stays as it was.
 *
 * @type {import('../types.mjs').Adapter}
 */
const jsonAdapter = {
  fileKind: 'json',
  fileKinds: ['json'],
  extensions: ['.json'],
  implemented: true,
  precheck: /handsontable/i,

  /**
   * @param {string} source File text.
   * @returns {import('../types.mjs').ParseHandle} Handle with one part.
   */
  parse(source) {
    const root = JSON.parse(source);

    return {
      parts: [{
        fileKind: 'json',
        source,
        root,
        json: new JsonDocument(source, root),
        j: null,
        lineOffset: 0,
        changed: false,
      }],
    };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @param {string} source Original file text.
   * @returns {string} Printed file.
   */
  print(handle, source) {
    return handle.parts[0].json?.text ?? source;
  },
};

export default jsonAdapter;
