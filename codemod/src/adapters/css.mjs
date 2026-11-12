import { extname } from 'node:path';
import postcss from 'postcss';
import scss from 'postcss-scss';

/**
 * Cheap test on raw stylesheet text: does it mention a Handsontable class, a theme variable, or a
 * Handsontable-related name. It deliberately does not require the word "handsontable", because a stylesheet
 * rarely says it.
 */
export const CSS_PRECHECK = /--ht-|\bht-|\bht[A-Z]|[Hh]andsontable|\.pika-/;

/**
 * Parse stylesheet text into a `css` part.
 *
 * @param {string} source Text to parse.
 * @param {string} from File name, used in postcss error messages.
 * @param {boolean} isScss Parse with the SCSS syntax instead of plain CSS.
 * @param {number} [lineOffset] Zero-based line of the text inside its file.
 * @returns {import('../types.mjs').Part} The part. It carries `syntax`, which `printCssPart` reads.
 * @throws {Error} When the text does not parse.
 */
export function createCssPart(source, from, isScss, lineOffset = 0) {
  const syntax = isScss ? scss : postcss;

  return {
    fileKind: 'css',
    source,
    root: syntax.parse(source, { from }),
    j: null,
    syntax,
    lineOffset,
    changed: false,
  };
}

/**
 * Print a `css` part back to text.
 *
 * @param {import('../types.mjs').Part} part A part made by `createCssPart`.
 * @returns {string} Printed text.
 */
export function printCssPart(part) {
  return part.root.toString(part.syntax === scss ? scss.stringify : undefined);
}

/**
 * Adapter for CSS and SCSS. The whole file is one `css` part whose `root` is a postcss Root. postcss keeps the
 * raw formatting of every node it does not touch, so an edited file keeps its layout.
 *
 * @type {import('../types.mjs').Adapter}
 */
const cssAdapter = {
  fileKind: 'css',
  fileKinds: ['css'],
  extensions: ['.css', '.scss'],
  implemented: true,
  precheck: CSS_PRECHECK,

  /**
   * @param {string} source File text.
   * @param {string} filePath File path, used to choose the syntax.
   * @returns {import('../types.mjs').ParseHandle} Handle with one part.
   */
  parse(source, filePath) {
    return { parts: [createCssPart(source, filePath, extname(filePath).toLowerCase() === '.scss')] };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @returns {string} Printed file.
   */
  print(handle) {
    return printCssPart(handle.parts[0]);
  },
};

export default cssAdapter;
