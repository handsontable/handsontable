import { JsonDocument, detectIndent } from '../lib/json-edit.mjs';

export { detectIndent };

const BOM = 0xFEFF;

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
    // npm accepts a leading byte order mark and `JSON.parse` does not. The document works on the text after the mark,
    // so every offset stays right, and `print()` puts the mark back.
    const bom = source.charCodeAt(0) === BOM ? source[0] : '';
    const text = source.slice(bom.length);
    const root = JSON.parse(text);

    return {
      bom,
      parts: [{
        fileKind: 'json',
        source: text,
        root,
        json: new JsonDocument(text, root),
        j: null,
        lineOffset: 0,
        changed: false,
      }],
    };
  },

  /**
   * @param {import('../types.mjs').ParseHandle & {bom?: string}} handle Handle from `parse`.
   * @param {string} source Original file text.
   * @returns {string} Printed file.
   */
  print(handle, source) {
    const [part] = handle.parts;

    return part.json ? `${handle.bom ?? ''}${part.json.text}` : source;
  },
};

export default jsonAdapter;
