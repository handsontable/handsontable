/**
 * Find the indentation of a JSON text: the leading whitespace of the first indented line.
 *
 * @param {string} source JSON text.
 * @returns {string|number} A tab character, or a number of spaces (2 when the text has no indented line).
 */
export function detectIndent(source) {
  const match = /^([ \t]+)\S/m.exec(source);

  if (!match) {
    return 2;
  }

  return match[1].startsWith('\t') ? '\t' : match[1].length;
}

/**
 * Adapter for JSON, in practice `package.json`. The whole file is one `json` part whose `root` is the parsed
 * value. A transform edits it in place. Printing writes the value back with the original indentation, line
 * ending, and trailing newline. Formatting that JSON.stringify does not produce (for example a short array
 * on one line) is normalized.
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
    return {
      parts: [{ fileKind: 'json', source, root: JSON.parse(source), j: null, lineOffset: 0, changed: false }],
    };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @param {string} source Original file text.
   * @returns {string} Printed file.
   */
  print(handle, source) {
    const eol = source.includes('\r\n') ? '\r\n' : '\n';
    const trailing = /\r?\n$/.test(source) ? eol : '';
    const text = JSON.stringify(handle.parts[0].root, null, detectIndent(source));

    return (eol === '\n' ? text : text.replace(/\n/g, eol)) + trailing;
  },
};

export default jsonAdapter;
