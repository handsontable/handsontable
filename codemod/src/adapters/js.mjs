import { extname } from 'node:path';
import jscodeshift from 'jscodeshift';

const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);

/**
 * Pick the jscodeshift parser for a file. `ts` handles TypeScript without JSX, `tsx` handles `.tsx`, and
 * `babylon` handles JavaScript with JSX, Flow-style annotations, and top-level await, so a `.js` file that
 * holds JSX parses.
 *
 * @param {string} filePath File path.
 * @returns {'ts'|'tsx'|'babylon'} Parser name.
 */
export function parserFor(filePath) {
  const extension = extname(filePath).toLowerCase();

  if (extension === '.tsx') {
    return 'tsx';
  }

  return TYPESCRIPT_EXTENSIONS.has(extension) ? 'ts' : 'babylon';
}

/**
 * Pick the quote style recast uses for nodes it creates, by counting what the file already uses.
 *
 * @param {string} source File text.
 * @returns {'single'|'double'} Quote style.
 */
export function detectQuote(source) {
  const single = (source.match(/(?:from|import)\s*'/g) ?? []).length;
  const double = (source.match(/(?:from|import)\s*"/g) ?? []).length;

  return double > single ? 'double' : 'single';
}

/**
 * Cheap test on raw JavaScript text: does it mention Handsontable or a theme variable at all.
 */
export const JS_PRECHECK = /handsontable|--ht-/i;

/**
 * Parse JavaScript or TypeScript text into a `js` part.
 *
 * @param {string} source Text to parse.
 * @param {'ts'|'tsx'|'babylon'} parser jscodeshift parser name, see `parserFor`.
 * @param {number} [lineOffset] Zero-based line of the text inside its file.
 * @returns {import('../types.mjs').Part} The part.
 * @throws {Error} When the text does not parse.
 */
export function createJsPart(source, parser, lineOffset = 0) {
  const j = jscodeshift.withParser(parser);

  return { fileKind: 'js', source, root: j(source), j, lineOffset, changed: false };
}

/**
 * Print a `js` part back to text. Recast reprints only the nodes a transform touched. A CRLF source keeps its
 * line terminator.
 *
 * @param {import('../types.mjs').Part} part A part made by `createJsPart`.
 * @param {string} source Original text of the part, used to detect the quote style and line terminator.
 * @returns {string} Printed text.
 */
export function printJsPart(part, source) {
  return part.root.toSource({
    quote: detectQuote(source),
    lineTerminator: source.includes('\r\n') ? '\r\n' : '\n',
  });
}

/**
 * Adapter for JavaScript and TypeScript. The whole file is one `js` part. Printing goes through recast, which
 * reprints only the nodes a transform touched, so an edited file keeps its formatting elsewhere.
 *
 * @type {import('../types.mjs').Adapter}
 */
const jsAdapter = {
  fileKind: 'js',
  fileKinds: ['js'],
  extensions: ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'],
  implemented: true,
  precheck: JS_PRECHECK,

  /**
   * @param {string} source File text.
   * @param {string} filePath File path, used to choose the parser.
   * @returns {import('../types.mjs').ParseHandle} Handle with one part.
   */
  parse(source, filePath) {
    return { parts: [createJsPart(source, parserFor(filePath))] };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @param {string} source Original file text.
   * @returns {string} Printed file.
   */
  print(handle, source) {
    return printJsPart(handle.parts[0], source);
  },
};

export default jsAdapter;
