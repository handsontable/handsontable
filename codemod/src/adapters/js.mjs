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
  precheck: /handsontable|--ht-/i,

  /**
   * @param {string} source File text.
   * @param {string} filePath File path, used to choose the parser.
   * @returns {import('../types.mjs').ParseHandle} Handle with one part.
   */
  parse(source, filePath) {
    const j = jscodeshift.withParser(parserFor(filePath));

    return {
      parts: [{ fileKind: 'js', source, root: j(source), j, lineOffset: 0, changed: false }],
    };
  },

  /**
   * @param {import('../types.mjs').ParseHandle} handle Handle from `parse`.
   * @param {string} source Original file text.
   * @returns {string} Printed file.
   */
  print(handle, source) {
    return handle.parts[0].root.toSource({ quote: detectQuote(source) });
  },
};

export default jsAdapter;
