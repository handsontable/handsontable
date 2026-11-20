import { extname } from 'node:path';
import postcss from 'postcss';
import scss from 'postcss-scss';
import { CssDocument } from '../lib/css-edit.mjs';

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
 * @returns {import('../types.mjs').Part} The part. It carries the `CssDocument` that records its edits.
 * @throws {Error} When the text does not parse.
 */
export function createCssPart(source, from, isScss, lineOffset = 0) {
  const syntax = isScss ? scss : postcss;
  const root = syntax.parse(source, { from });

  return {
    fileKind: 'css',
    source,
    root,
    j: null,
    document: new CssDocument(source, root, text => syntax.parse(text, { from }), {
      lineComments: isScss && /^[ \t]*\/\//m.test(source),
    }),
    lineOffset,
    changed: false,
  };
}

/**
 * Print a `css` part back to text: the original with the edits of its `CssDocument` spliced in. The root is never
 * stringified, because that would change bytes no transform touched.
 *
 * @param {import('../types.mjs').Part} part A part made by `createCssPart`.
 * @returns {string} Printed text.
 * @throws {Error} When the edited text does not match the intended edits.
 */
export function printCssPart(part) {
  return part.document.print();
}

/**
 * Adapter for CSS and SCSS. The whole file is one `css` part whose `root` is a postcss Root, which transforms read.
 * They edit through the part's `CssDocument`, so an edited file differs from the original only where an edit is.
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
