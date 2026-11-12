import { extname } from 'node:path';
import postcss from 'postcss';
import scss from 'postcss-scss';

/**
 * Adapter for CSS and SCSS. The whole file is one `css` part whose `root` is a postcss Root. postcss keeps the
 * raw formatting of every node it does not touch, so an edited file keeps its layout.
 *
 * The precheck lets a file through when it mentions a Handsontable class, a theme variable, or a
 * Handsontable-related name. It deliberately does not require the word "handsontable", because a stylesheet
 * rarely says it.
 *
 * @type {import('../types.mjs').Adapter}
 */
const cssAdapter = {
  fileKind: 'css',
  fileKinds: ['css'],
  extensions: ['.css', '.scss'],
  implemented: true,
  precheck: /--ht-|\bht-|\bht[A-Z]|[Hh]andsontable|\.pika-/,

  /**
   * @param {string} source File text.
   * @param {string} filePath File path, used to choose the syntax.
   * @returns {import('../types.mjs').ParseHandle} Handle with one part.
   */
  parse(source, filePath) {
    const syntax = extname(filePath).toLowerCase() === '.scss' ? scss : postcss;

    const root = syntax.parse(source, { from: filePath });

    return {
      syntax,
      parts: [{ fileKind: 'css', source, root, j: null, lineOffset: 0, changed: false }],
    };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @returns {string} Printed file.
   */
  print(handle) {
    const stringifier = handle.syntax === scss ? scss.stringify : undefined;

    return handle.parts[0].root.toString(stringifier);
  },
};

export default cssAdapter;
