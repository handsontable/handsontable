import babylonParser from 'jscodeshift/parser/babylon.js';
import tsParser from 'jscodeshift/parser/ts.js';
import tsxParser from 'jscodeshift/parser/tsx.js';

const PARSERS = { babylon: babylonParser, ts: tsParser, tsx: tsxParser };

/**
 * The comments this tool writes: a `//` line, or a block comment (a JSX comment and a stylesheet comment are blocks),
 * that starts with `TODO(handsontable-codemod `.
 */
const TOOL_COMMENT = /\/\/[ \t]*TODO\(handsontable-codemod [^\r\n]*|\/\*[ \t]*TODO\(handsontable-codemod [\s\S]*?\*\//g;

/**
 * Replace the characters of a range with spaces and keep the line breaks.
 *
 * @param {string} text Text.
 * @returns {string} Text of the same length and the same lines.
 */
function blank(text) {
  return text.replace(/[^\r\n]/g, ' ');
}

/**
 * Replace every comment the tool wrote with spaces, and keep the line breaks, so an offset or a line number of the
 * text is the same as before.
 *
 * A marker repeats the guide link and the first sentence of its rule, and both can hold the words a rule looks for
 * (the guide anchor of the license key section names the key). A matcher that reads raw text must therefore never
 * see them, or the second run reports its own marker as a new match.
 *
 * @param {string} source Text of a part.
 * @returns {string} The text without the comments of the tool.
 */
export function blankToolComments(source) {
  return source.includes('TODO(handsontable-codemod ') ? source.replace(TOOL_COMMENT, blank) : source;
}

/**
 * Replace every comment of a js part with spaces, the tool's own and the project's, and keep the line breaks. The
 * parser reads the original text, so its offsets are real even in a file indented with tabs. A text the parser
 * rejects comes back with only the comments of the tool blanked.
 *
 * @param {'ts'|'tsx'|'babylon'|null} parser The parser name of the part.
 * @param {string} source Text of the part.
 * @returns {string} The text without comments.
 */
export function blankCodeComments(parser, source) {
  const text = blankToolComments(source);

  if (!PARSERS[parser]) {
    return text;
  }

  try {
    const { comments = [] } = PARSERS[parser]().parse(text);

    return comments
      .filter(comment => Number.isInteger(comment.start) && Number.isInteger(comment.end))
      .reduceRight((out, comment) => out.slice(0, comment.start) + blank(out.slice(comment.start, comment.end))
        + out.slice(comment.end), text);
  } catch {
    return text;
  }
}
