import postcss from 'postcss';

/**
 * Prefix of every comment this tool leaves behind.
 */
export const TODO_PREFIX = 'TODO(handsontable-codemod';

/**
 * Build the text of a TODO comment, without comment delimiters. The text is flattened to one line.
 *
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do.
 * @returns {string} For example `TODO(handsontable-codemod 18.0.0/x): replace this`.
 */
export function formatTodo(ruleId, text) {
  return `${TODO_PREFIX} ${ruleId}): ${String(text).replace(/\s*\r?\n\s*/g, ' ').trim()}`;
}

/**
 * Leave a `//` TODO comment before a JavaScript or TypeScript AST node, unless the node already carries the
 * same comment. This module and `addCssTodo` are the only writers of TODO comments in the codemod.
 *
 * @param {object} j The jscodeshift API.
 * @param {object} target An AST node or a NodePath.
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do.
 * @returns {boolean} `true` when a comment was inserted, `false` when an identical one was already there.
 */
export function addJsTodo(j, target, ruleId, text) {
  const node = target.node ?? target;
  const body = formatTodo(ruleId, text);

  node.comments = node.comments ?? [];

  if (node.comments.some(comment => comment.value.trim() === body)) {
    return false;
  }

  node.comments.push(j.commentLine(` ${body}`, true, false));

  return true;
}

/**
 * Leave a block comment before a postcss node, unless the node is already preceded by the same comment. A
 * block comment is valid in CSS and in SCSS.
 *
 * @param {object} target A postcss node (a declaration, rule, or at-rule) that has a parent.
 * @param {string} ruleId Id of the rule that asks for the follow-up.
 * @param {string} text What the user has to do.
 * @returns {boolean} `true` when a comment was inserted, `false` when an identical one was already there.
 */
export function addCssTodo(target, ruleId, text) {
  const body = formatTodo(ruleId, text);
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
