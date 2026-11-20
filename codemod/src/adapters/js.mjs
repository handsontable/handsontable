import { extname } from 'node:path';
import jscodeshift from 'jscodeshift';
import { calleeName, propertyName, unwrapNode } from '../lib/ast.mjs';
import { spliceCarriers } from '../lib/carrier.mjs';
import { assertLeadingTrivia, maskShebang, splitBom, unmaskShebang } from '../lib/leading-trivia.mjs';
import { dominantBreak, restoreLineEndings } from '../lib/line-endings.mjs';
import { guardLiterals, intendedLiterals, keepJsxEntities, linesInsideLiterals } from '../lib/literals.mjs';

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
 * Pick the quote style recast uses for nodes it creates, by counting what the file already uses in the module
 * position: `import 'x'`, `from 'x'`, `require('x')`, and `import('x')`. A member call such as `Array.from('x')` is not
 * a module position.
 *
 * @param {string} source File text.
 * @returns {'single'|'double'} Quote style.
 */
export function detectQuote(source) {
  const single = (source.match(/(?<![\w$.])(?:from|import|require)\s*\(?\s*'/g) ?? []).length;
  const double = (source.match(/(?<![\w$.])(?:from|import|require)\s*\(?\s*"/g) ?? []).length;

  return double > single ? 'double' : 'single';
}

/**
 * Tell whether a file indents with tabs, by counting the lines that start with a tab against the lines that start
 * with a space. A line that continues a block comment (` * text`) is not indentation and is left out, and so is a
 * blank line. Ties and files without indentation count as spaces.
 *
 * recast guesses the width of a space indent from the source by itself, but it prints tabs as spaces unless it is
 * told to use them, so a reprinted statement of a tab-indented file would come out with spaces.
 *
 * @param {string} source File text.
 * @returns {boolean} `true` when the file is indented with tabs.
 */
export function usesTabs(source) {
  let tabs = 0;
  let spaces = 0;

  for (const line of source.split(/\r\n|[\n\r\u2028\u2029]/)) {
    if (line.startsWith('\t')) {
      tabs += 1;
    } else if (line.startsWith(' ') && /\S/.test(line) && !/^ +\*/.test(line)) {
      spaces += 1;
    }
  }

  return tabs > spaces;
}

const TAB_WIDTH = 4;

/**
 * Give the lines that recast printed with spaces back their tabs, in a tab-indented file. Even with `useTabs`, recast
 * prints the first statement of a block it reprints with spaces. A line that the source already had is left as it
 * is, so a file that mixes the two styles keeps its minority lines. Any other line that starts with spaces is
 * measured in columns (a tab is `TAB_WIDTH` columns) and written with as many tabs as fit, and the rest stay spaces,
 * as alignment. A line that begins inside a string or template literal is never changed, because its white space is
 * part of the string.
 *
 * @param {string} printed The text recast printed.
 * @param {string} source Original text of the part.
 * @param {string} lineTerminator Line terminator of the part.
 * @param {Set<number>} insideLiterals Indexes of the lines that begin inside a literal.
 * @returns {string} The text with tab indentation.
 */
function restoreTabs(printed, source, lineTerminator, insideLiterals) {
  const original = new Set(source.split(lineTerminator));

  return printed.split(lineTerminator).map((line, index) => {
    const [indent] = /^[ \t]*/.exec(line);

    if (!indent.includes(' ') || original.has(line) || /^ +\*/.test(line) || insideLiterals.has(index)) {
      return line;
    }

    let columns = 0;

    for (const character of indent) {
      columns = character === '\t' ? (Math.floor(columns / TAB_WIDTH) + 1) * TAB_WIDTH : columns + 1;
    }

    const tabs = Math.floor(columns / TAB_WIDTH);

    return '\t'.repeat(tabs) + ' '.repeat(columns - (tabs * TAB_WIDTH)) + line.slice(indent.length);
  }).join(lineTerminator);
}

/**
 * Cheap test on raw JavaScript text: does it mention Handsontable or a theme variable at all.
 */
export const JS_PRECHECK = /handsontable|--ht-/i;

/**
 * The precheck of a file of the adapter: `JS_PRECHECK`, or a wrapper tag, because an Angular component whose module is
 * declared elsewhere can hold `<hot-table>` in its inline template and never name Handsontable.
 */
const FILE_PRECHECK = new RegExp(`${JS_PRECHECK.source}|<hot-(?:table|column)\\b|<Hot(?:Table|Column)\\b`, 'i');

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

  return { fileKind: 'js', source, root: j(maskShebang(source)), j, parser, lineOffset, changed: false };
}

/**
 * The line terminator the printer writes: `\r\n` when most of the lines of the source end with it, otherwise `\n`. A
 * file that uses another ending gets it back after printing (`restoreLineEndings()`).
 *
 * @param {string} source Text of the part.
 * @returns {'\r\n'|'\n'} The terminator for recast and the helpers that work on its output.
 */
function workingTerminator(source) {
  return dominantBreak(source) === '\r\n' ? '\r\n' : '\n';
}

/**
 * Print a `js` part back to text. Recast reprints only the nodes a transform touched. A CRLF source keeps its line
 * terminator, and a tab-indented source keeps tabs in the lines recast prints again.
 *
 * The steps, in this order:
 *
 * 1. Read the intended text of every literal that spans lines, and of every JSX text, from the final tree
 * (`intendedLiterals()`), then give the JSX texts nobody edited their raw spelling (`keepJsxEntities()`).
 * 2. Print, splice the marker carriers in (a sentinel is not valid code, so nothing can be parsed before this), and
 * remove a stray `;`.
 * 3. Parse the text with a plain parser and put back any literal that printing changed (`guardLiterals()`). It
 * comes before the tab fix so that the fix learns which lines begin inside a literal, and it parses only a part
 * that changed, because `printJsPart()` runs for no other.
 * 4. Check that the comments and directives before the first statement of the source are still there, in order
 * (`assertLeadingTrivia()`).
 * 5. Fix the tabs of a tab-indented file, never in a line that begins inside a literal, and check the result once
 * more when that changed the text.
 *
 * A failure in step 3, 4, or 5 throws, and `transformFile()` leaves the file alone.
 *
 * @param {import('../types.mjs').Part} part A part made by `createJsPart`.
 * @param {string} source Original text of the part, used to detect the quote style and line terminator.
 * @returns {string} Printed text.
 * @throws {Error} When a string or template literal cannot be kept as intended, or the text does not parse.
 */
export function printJsPart(part, source) {
  return restoreLineEndings(source, printWithTerminator(part, source), workingTerminator(source));
}

/**
 * Print a `js` part with one line terminator for the whole text. See `printJsPart()` for the steps. A byte order mark
 * is kept out of the steps and written back in front of the result.
 *
 * @param {import('../types.mjs').Part} part A part made by `createJsPart`.
 * @param {string} original Original text of the part.
 * @returns {string} Printed text, ended by `workingTerminator(original)`.
 */
function printWithTerminator(part, original) {
  const { bom, text: bare } = splitBom(original);

  return bom + unmaskShebang(bare, printBare(part, maskShebang(bare)));
}

/**
 * The steps of `printJsPart()` on a text with no byte order mark and no shebang line (a shebang is a comment of the
 * same length here).
 *
 * @param {import('../types.mjs').Part} part A part made by `createJsPart`.
 * @param {string} source Original text of the part, without a byte order mark, its shebang made a comment.
 * @returns {string} Printed text without a byte order mark.
 */
function printBare(part, source) {
  const lineTerminator = workingTerminator(source);
  const tabs = usesTabs(source);
  const parser = part.parser ?? 'babylon';
  const intended = intendedLiterals(part);

  keepJsxEntities(part);

  const printed = splitBom(part.root.toSource({
    quote: detectQuote(source),
    lineTerminator,
    ...(tabs ? { useTabs: true, tabWidth: TAB_WIDTH } : {}),
  })).text;
  const spliced = spliceCarriers(part.carriers, printed, lineTerminator);
  const guarded = guardLiterals({
    parser,
    intended,
    text: stripStraySemicolons(part, spliced, source),
    source,
    lineTerminator,
  });

  assertLeadingTrivia(parser, source, guarded.text);

  if (!tabs) {
    return guarded.text;
  }

  const insideLiterals = linesInsideLiterals(guarded.text, guarded.literals, lineTerminator);
  const restored = restoreTabs(guarded.text, source, lineTerminator, insideLiterals);

  return restored === guarded.text
    ? restored
    : guardLiterals({ parser, intended, text: restored, source, lineTerminator, repair: false }).text;
}

/**
 * Remove the second `;` that recast prints after a directive (`'use client';;`) when a statement below it was
 * removed. The tree has no empty statement there, so the text is fixed after printing. Only a `;;` the source did
 * not already have is removed.
 *
 * @param {import('../types.mjs').Part} part A part made by `createJsPart`.
 * @param {string} printed The text recast printed.
 * @param {string} source Original text of the part.
 * @returns {string} The text without the stray semicolons.
 */
function stripStraySemicolons(part, printed, source) {
  const program = part.root.find(part.j.Program).paths()[0]?.node;
  let text = printed;

  for (const directive of program?.directives ?? []) {
    const raw = directive.value?.extra?.raw ?? directive.extra?.raw;

    if (typeof raw === 'string' && text.includes(`${raw};;`) && !source.includes(`${raw};;`)) {
      text = text.replace(`${raw};;`, `${raw};`);
    }
  }

  return text;
}

/**
 * The text of a template literal for the rules that read a template: the static parts, with one space where each
 * `${...}` was, and a line break for every line break the expression spans (counted from the lines of the quasis on
 * both sides), so the lines after an interpolation are the lines of the file. The expression is not read.
 *
 * @param {object} literal A `TemplateLiteral` node.
 * @returns {string} The content.
 */
function templateContent(literal) {
  return literal.quasis.map((quasi, index) => {
    const next = literal.quasis[index + 1];
    const spanned = next && quasi.loc && next.loc ? Math.max(0, next.loc.start.line - quasi.loc.end.line) : 0;

    return next ? `${quasi.value.raw} ${'\n'.repeat(spanned)}` : quasi.value.raw;
  }).join('');
}

/**
 * The `template` parts of the inline templates of an Angular component: the string or template literal that the
 * `template` property of the object passed to `@Component({...})` (or `Component({...})`) holds. A template part is
 * read only, as the one of a Vue file or an `.html` page is, so the rules that report on a template report on it.
 * Its `lineOffset` is the line of the opening quote, which is part line 1, and nothing prints it.
 *
 * @param {import('../types.mjs').Part} part The `js` part of the file.
 * @returns {import('../types.mjs').Part[]} The template parts, in source order.
 */
function inlineTemplateParts(part) {
  if (!part.source.includes('@angular/core') || !/\btemplate\b/.test(part.source)) {
    return [];
  }

  const { j } = part;
  const found = [];

  part.root.find(j.CallExpression).forEach((path) => {
    const argument = unwrapNode(path.node.arguments[0]);

    if (calleeName(path.node.callee) !== 'Component' || argument?.type !== 'ObjectExpression') {
      return;
    }

    for (const property of argument.properties) {
      const value = property.type === 'ObjectProperty' && propertyName(property) === 'template'
        ? unwrapNode(property.value) : null;
      let content = null;

      if (value?.type === 'StringLiteral' || (value?.type === 'Literal' && typeof value.value === 'string')) {
        content = value.value;
      } else if (value?.type === 'TemplateLiteral') {
        content = templateContent(value);
      }

      if (content !== null && value.loc) {
        found.push({
          fileKind: 'template',
          source: content,
          root: { content },
          j: null,
          lineOffset: part.lineOffset + value.loc.start.line - 1,
          changed: false,
        });
      }
    }
  });

  return found;
}

/**
 * Adapter for JavaScript and TypeScript. The file is one `js` part, plus a read-only `template` part for each inline
 * Angular template. Printing goes through recast, which
 * reprints only the nodes a transform touched, so an edited file keeps its formatting elsewhere.
 *
 * @type {import('../types.mjs').Adapter}
 */
const jsAdapter = {
  fileKind: 'js',
  fileKinds: ['js', 'template'],
  extensions: ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'],
  implemented: true,
  precheck: FILE_PRECHECK,

  /**
   * @param {string} source File text.
   * @param {string} filePath File path, used to choose the parser.
   * @returns {import('../types.mjs').ParseHandle} Handle with the `js` part first, then one read-only `template` part
   * for each inline Angular template.
   */
  parse(source, filePath) {
    const part = createJsPart(source, parserFor(filePath));

    return { parts: [part, ...inlineTemplateParts(part)] };
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
