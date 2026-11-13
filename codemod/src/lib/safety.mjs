/**
 * The one meaning of a rule's `safe` field.
 *
 * - `safe: true`: the tool applies the rewrite by default.
 * - `safe: false`: the tool never edits code for the rule. It reports `manual` entries, and it may leave a
 *   `TODO(handsontable-codemod ...)` comment, which is not a code change, when the rule asks for one
 *   (`todo: true`) or when the rule only says that something was removed.
 * - `detect` and `exportRemoved` rules are report-only by their kind. They carry no `safe: true`, and the
 *   manifest loader treats an omitted `safe` as `false` for them. Every other kind must state `safe`.
 */

/**
 * Kinds that never rewrite code, whatever their `safe` says.
 */
export const REPORT_ONLY_KINDS = Object.freeze(['detect', 'exportRemoved']);

/**
 * Whether a kind has to spell out `safe` in the manifest.
 *
 * @param {string} kind Rule kind.
 * @returns {boolean} `false` for the kinds that are report-only by definition.
 */
export function requiresSafe(kind) {
  return !REPORT_ONLY_KINDS.includes(kind);
}

/**
 * Whether the tool may edit code for a rule.
 *
 * @param {{kind?: string, safe?: boolean}} rule A loaded rule.
 * @returns {boolean} `true` only for a rule that states `safe: true` and is not report-only by kind.
 */
export function rewrites(rule) {
  return rule.safe === true && requiresSafe(rule.kind);
}

/**
 * How a rule acts, for `--list` and the README: `rewrite` or `report`.
 *
 * @param {{kind?: string, safe?: boolean}} rule A loaded rule.
 * @returns {'rewrite'|'report'} The mode.
 */
export function modeOf(rule) {
  return rewrites(rule) ? 'rewrite' : 'report';
}

/**
 * Report that a rewrite was left to the user because the rule is not safe. The entry is `manual`, and the rule's
 * `note` (or its `message`) follows the instruction when there is one. A rule with `todo: true` also leaves a
 * TODO comment before `target`, when the caller names one.
 *
 * @param {import('../types.mjs').Ctx} ctx The transform context.
 * @param {import('../types.mjs').Rule} rule The rule.
 * @param {number|undefined} line One-based line in the part.
 * @param {string} instruction What to do by hand, one sentence.
 * @param {object|null} [target] Node or path that takes the TODO comment, or `null` for a report only.
 * @param {string} [comment] Short text for the TODO comment. Defaults to `instruction`.
 * @param {number} [markLine] The line the generic TODO marker is placed from, when `line` is inside a literal.
 * @returns {void}
 */
export function reportInstead(
  ctx,
  rule,
  line,
  instruction,
  target = null,
  comment = instruction,
  markLine = undefined,
) {
  const message = [instruction, rule.note ?? rule.message].filter(Boolean).join(' ');

  if (target && rule.todo === true) {
    ctx.todo(target, rule.id, message, comment);

    return;
  }

  ctx.report({ ruleId: rule.id, severity: 'manual', line, markLine, message });
}
