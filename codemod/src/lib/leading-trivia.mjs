/**
 * What stands before the first statement of a file must come out of a run as it went in: a byte order mark, a
 * shebang line, a license or header comment, a `// @ts-check` or an eslint directive, and a directive prologue
 * (`'use client'`). recast patches the statement it prints again over the text around it, and when that statement
 * is the first one it can swallow the line break of a shebang (or print the shebang below the directives), drop a
 * byte order mark, or lose a comment.
 *
 * `splitBom()` lets the print path keep the byte order mark out of the way, and `maskShebang()` and `unmaskShebang()`
 * make the shebang line an ordinary comment while the tool works on the text. `assertLeadingTrivia()` compares the
 * comments and directives that precede the first statement of the source with the printed text and throws when one
 * is gone or reordered, so `transformFile()` leaves the file alone. A comment the run adds (a TODO) or a comment that moves from a removed statement to the next one
 * passes: the comments of the source must appear in the printed text in the same order, and more are allowed.
 */
import babylonParser from 'jscodeshift/parser/babylon.js';
import tsParser from 'jscodeshift/parser/ts.js';
import tsxParser from 'jscodeshift/parser/tsx.js';

const PARSERS = { babylon: babylonParser, ts: tsParser, tsx: tsxParser };
const BOM = '\uFEFF';
const SHEBANG = /^#![^\r\n\u2028\u2029]*/;
const TERMINATOR = /^(?:\r\n|[\r\n\u2028\u2029])/;

/**
 * Split off a leading byte order mark. recast drops it when it prints the first statement again, and a plain parse
 * reads a shebang only at the very start, so the print path works on text without it and writes it back at the end.
 *
 * @param {string} text File text.
 * @returns {{bom: string, text: string}} The mark (empty when there is none) and the text after it.
 */
export function splitBom(text) {
  return text.startsWith(BOM) ? { bom: BOM, text: text.slice(BOM.length) } : { bom: '', text };
}

/**
 * Turn the `#!` of a shebang line into `//`, so the line is an ordinary comment for the parser and for recast. With
 * its own `interpreter` node, recast prints a shebang wherever its patcher lands, and that is after the directives and
 * the comments of the file when the first statement is printed again. A comment of the same length keeps every
 * offset and line, and the tool puts the two characters back after printing (`unmaskShebang()`).
 *
 * @param {string} text File text, with or without a byte order mark.
 * @returns {string} The text with the first line a comment when it was a shebang, else the text itself.
 */
export function maskShebang(text) {
  const { bom, text: bare } = splitBom(text);

  return SHEBANG.test(bare) ? `${bom}//${bare.slice(2)}` : text;
}

/**
 * Write the `#!` of the shebang line back after printing a text that `maskShebang()` made. The masked line must still
 * be the first line, unchanged, or nothing says where the shebang went.
 *
 * @param {string} original Original text of the part, without a byte order mark.
 * @param {string} printed The printed text made from `maskShebang(original)`, without a byte order mark.
 * @returns {string} The printed text with its shebang line.
 * @throws {Error} When the source starts with a shebang and the printed text does not start with its comment form.
 */
export function unmaskShebang(original, printed) {
  const bang = SHEBANG.exec(original)?.[0];

  if (bang === undefined) {
    return printed;
  }

  const masked = `//${bang.slice(2)}`;
  const rest = printed.slice(masked.length);

  if (!printed.startsWith(masked) || (rest !== '' && !TERMINATOR.test(rest))) {
    throw new Error('the shebang line was lost or moved while printing');
  }

  return `#!${printed.slice(2)}`;
}

/**
 * The comments and directives that stand before the first statement of a text.
 *
 * @param {'babylon'|'ts'|'tsx'} parser Parser name.
 * @param {string} text File text.
 * @returns {{comments: string[], directives: string[]}} Comments as `type:text` with the white space squeezed, and
 * the raw text of each directive, in the order of the text.
 * @throws {Error} When the text does not parse.
 */
function leadingTrivia(parser, text) {
  const file = PARSERS[parser]().parse(text);
  const first = file.program.body[0]?.start ?? Infinity;
  const comments = (file.comments ?? file.program.comments ?? [])
    .filter(comment => comment.end <= first)
    .map(comment => `${comment.type}:${comment.value.replace(/\s+/g, ' ').trim()}`);
  const directives = (file.program.directives ?? [])
    .map(directive => directive.value?.extra?.raw ?? directive.value?.value);

  return { comments, directives };
}

/**
 * Check that the comments and directives before the first statement of the source are still there, in order.
 *
 * @param {'babylon'|'ts'|'tsx'} parser Parser name of the part.
 * @param {string} source Original text of the part.
 * @param {string} printed The printed text.
 * @throws {Error} When a comment or a directive that stood before the first statement is gone or out of order, or the
 * text does not parse.
 */
export function assertLeadingTrivia(parser, source, printed) {
  const before = leadingTrivia(parser, source);

  if (before.comments.length === 0 && before.directives.length === 0) {
    return;
  }

  const after = leadingTrivia(parser, printed);

  if (before.directives.length !== after.directives.length
    || before.directives.some((directive, index) => directive !== after.directives[index])) {
    throw new Error('a directive before the first statement was lost or changed while printing');
  }

  let at = 0;

  for (const comment of before.comments) {
    at = after.comments.indexOf(comment, at);

    if (at === -1) {
      throw new Error('a comment before the first statement was lost or moved while printing');
    }

    at += 1;
  }
}
