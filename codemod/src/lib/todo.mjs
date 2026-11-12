import postcss from 'postcss';

/**
 * Prefix of every comment this tool leaves behind.
 */
export const TODO_PREFIX = 'TODO(handsontable-codemod';

/**
 * Longest TODO text, in characters, before the guide link.
 */
export const TODO_MAX_LENGTH = 100;

/**
 * A sentence shorter than this takes the next sentence along, so "Removed in 18.0." does not stand alone.
 */
const SHORT_SENTENCE = 40;

/**
 * Split text into sentences. A sentence ends with `.`, `!`, or `?` followed by white space, so a version such as
 * `18.0` or a dotted name such as `Handsontable.helper` stays whole.
 *
 * @param {string} text Text on one line.
 * @returns {string[]} The sentences, trimmed.
 */
function sentencesOf(text) {
  return text.split(/(?<=[.!?])\s+/).map(sentence => sentence.trim()).filter(Boolean);
}

/**
 * Cut advice down to what fits in a code comment: the first sentence, plus the next one while the first is very
 * short and both fit. A longer sentence is cut at a word boundary and ends with `...`. The text is flattened to
 * one line. The full advice stays in the report entry.
 *
 * @param {string} text The advice.
 * @param {number} [max] Longest result in characters.
 * @returns {string} One short line that ends with a full stop, a question mark, an exclamation mark, or `...`.
 */
export function shortenAdvice(text, max = TODO_MAX_LENGTH) {
  const sentences = sentencesOf(String(text).replace(/\s*\r?\n\s*/g, ' ').trim());
  let short = sentences[0] ?? '';

  for (let next = 1; short.length < SHORT_SENTENCE && next < sentences.length
    && short.length + 1 + sentences[next].length <= max; next += 1) {
    short = `${short} ${sentences[next]}`;
  }

  if (short.length > max) {
    const cut = short.slice(0, max - 3);
    const space = cut.lastIndexOf(' ');

    short = `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, '')}...`;
  }

  return /[.!?]$/.test(short) || short === '' ? short : `${short}.`;
}

/**
 * Build the text of a TODO comment, without comment delimiters: the marker, the rule id, the first sentence of the
 * advice, and the guide link when there is one.
 *
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do. Only its first sentence is kept.
 * @param {string|null} [guideUrl] Link to the guide section, or `null` for none.
 * @returns {string} For example `TODO(handsontable-codemod 18.0.0/x): Replace this. See https://...#anchor`.
 */
export function formatTodo(ruleId, text, guideUrl = null) {
  return `${TODO_PREFIX} ${ruleId}): ${shortenAdvice(text)}${guideUrl ? ` See ${guideUrl}` : ''}`;
}

/**
 * Leave a `//` TODO comment before a JavaScript or TypeScript AST node, unless the node already carries the
 * same comment. This module and `addCssTodo` are the only writers of TODO comments in the codemod.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} target An AST node or a NodePath.
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do. Only its first sentence is kept.
 * @param {string|null} [guideUrl] Link to the guide section, or `null` for none.
 * @returns {boolean} `true` when a comment was inserted, `false` when an identical one was already there.
 */
export function addJsTodo(j, target, ruleId, text, guideUrl = null) {
  const node = target.node ?? target;
  const body = formatTodo(ruleId, text, guideUrl);

  node.comments = node.comments ?? [];

  if (node.comments.some(comment => comment.value.trim() === body)) {
    return false;
  }

  // The TODO goes after the leading comments and before a trailing one, so a note at the end of the line stays there.
  const trailing = node.comments.findIndex(comment => comment.trailing === true);

  node.comments.splice(trailing === -1 ? node.comments.length : trailing, 0, j.commentLine(` ${body}`, true, false));

  return true;
}

/**
 * Leave a block comment before a postcss node, unless the node is already preceded by the same comment. A
 * block comment is valid in CSS and in SCSS.
 *
 * @param {object} target A postcss node (a declaration, rule, or at-rule) that has a parent.
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do. Only its first sentence is kept.
 * @param {string|null} [guideUrl] Link to the guide section, or `null` for none.
 * @returns {boolean} `true` when a comment was inserted, `false` when an identical one was already there.
 */
export function addCssTodo(target, ruleId, text, guideUrl = null) {
  const body = formatTodo(ruleId, text, guideUrl);
  const previous = target.prev();

  if (previous && previous.type === 'comment' && previous.text.trim() === body) {
    return false;
  }

  target.before(postcss.comment({ text: body }));

  return true;
}

/**
 * Line number of a js node or a postcss node, or `null` when it has none.
 *
 * @param {object} target An AST node, a NodePath, or a postcss node.
 * @returns {number|null} One-based line.
 */
export function lineOf(target) {
  const node = target?.node ?? target;

  return node?.loc?.start?.line ?? node?.source?.start?.line ?? null;
}
