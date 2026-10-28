/**
 * The axe discovery run: the pure half.
 *
 * The gating axe scan (`a11y/axe.spec.ts`) runs the WCAG 2.2 A and AA rules on the catalog and compares
 * them with the baseline. The discovery run (`a11y/checks/axe-discovery.spec.ts`, nightly only) runs
 * more: the best-practice, AAA and experimental rules, on the catalog, on states the catalog lacks, in
 * the dark scheme and right to left on every page that takes them, and on a second phone. It never
 * reads or writes the baseline and never touches the `A11y / axe report` check run: its records are
 * for triage, by a person or by the agent grader, which is why every "needs review" result is listed
 * with axe's own reason. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */
import { targetFingerprint, wcagCriteria } from './a11y-baseline.mjs';

export const DISCOVERY_CHECK = 'axe-discovery';
// The gating scan's tags, then the ones only discovery adds.
export const DISCOVERY_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice', 'experimental'];
const A_AA = new Set(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']);
const IMPACTS = new Set(['critical', 'serious', 'moderate', 'minor']);

/**
 * The family of an axe rule, from its tags: `experimental` (whatever else it is tagged), `wcag-a-aa`
 * (the set the gating scan runs), `wcag-aaa`, or `best-practice`.
 *
 * @param {string[]} tags The rule's tags.
 * @returns {'experimental'|'wcag-a-aa'|'wcag-aaa'|'best-practice'} The family.
 */
export function ruleFamily(tags = []) {
  if (tags.includes('experimental')) {
    return 'experimental';
  }
  if (tags.some(tag => A_AA.has(tag))) {
    return 'wcag-a-aa';
  }
  if (tags.includes('wcag2aaa')) {
    return 'wcag-aaa';
  }

  return 'best-practice';
}

/**
 * Why axe flagged a node, or could not decide: the first message of its `any`, `all` or `none` checks,
 * or its failure summary.
 *
 * @param {object} node The axe result node.
 * @returns {string} The reason.
 */
export function nodeReason(node) {
  return firstCheck(node)?.message ?? node.failureSummary ?? 'axe gave no reason';
}

/**
 * What a "needs review" result turned on, stable from run to run: the id of the axe check behind its
 * first message, and that check's message key when it has one (`color-contrast:bgImage`). A record is
 * keyed on this, never on the message: axe writes per-node values into some messages (a size in px, an
 * `aria-controls` id that carries the instance's random guid), so a key on the text would split one
 * finding per node and give it a new id on every run.
 *
 * @param {object} node The axe result node.
 * @returns {string} The cause, or `unknown` when no check gave a message.
 */
export function nodeCause(node) {
  const check = firstCheck(node);
  const messageKey = check?.data?.messageKey;

  return [check?.id ?? 'unknown', ...(typeof messageKey === 'string' ? [messageKey] : [])].join(':');
}

/**
 * The first of a node's `any`, `all` and `none` checks that gave a message.
 *
 * @param {object} node The axe result node.
 * @returns {object|undefined} The check.
 */
function firstCheck(node) {
  return [...(node.any ?? []), ...(node.all ?? []), ...(node.none ?? [])].find(check => check?.message);
}

/**
 * The triage records of one scan: a violation per rule and element shape (its fingerprint, the way the
 * baseline keys a finding), and a "needs review" result per rule, element shape and cause
 * (`nodeCause()`), each with the number of nodes, an example selector and the rule's family. A
 * violation carries axe's impact as its severity; a needs-review result is advisory, and its reason is
 * the first node's message. A best-practice rule maps to no WCAG criterion.
 *
 * @param {{violations: object[], incomplete: object[]}} results The axe results.
 * @returns {object[]} The records.
 */
export function discoveryFindings({ violations = [], incomplete = [] }) {
  const records = new Map();
  const add = (kind, rule, node) => {
    const selector = targetFingerprint(node.target ?? [], node.html ?? '');
    const cause = kind === 'axe-needs-review' ? nodeCause(node) : undefined;
    const key = [kind, rule.id, selector, cause ?? ''].join('|');
    const existing = records.get(key);

    if (existing) {
      existing.measured.nodes += 1;

      return;
    }

    const example = Array.isArray(node.target) ? String(node.target.at(-1)) : '';

    records.set(key, {
      kind,
      rule: rule.id,
      criteria: wcagCriteria(rule.tags),
      severity: kind === 'axe-violation' ? (IMPACTS.has(rule.impact) ? rule.impact : 'minor') : 'advisory',
      selector,
      measured: { rule: rule.id, family: ruleFamily(rule.tags), nodes: 1, example },
      reason: kind === 'axe-violation' ? rule.help : `${rule.help}: ${nodeReason(node)}`,
      ...(cause ? { cause } : {}),
    });
  };

  for (const rule of violations) {
    for (const node of rule.nodes ?? []) {
      add('axe-violation', rule, node);
    }
  }
  for (const rule of incomplete) {
    for (const node of rule.nodes ?? []) {
      add('axe-needs-review', rule, node);
    }
  }

  return [...records.values()];
}
