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
  const message = [...(node.any ?? []), ...(node.all ?? []), ...(node.none ?? [])].map(check => check?.message).find(Boolean);

  return message ?? node.failureSummary ?? 'axe gave no reason';
}

/**
 * The triage records of one scan: a violation per rule and element shape (its fingerprint, the way the
 * baseline keys a finding), and a "needs review" result per rule, element shape and reason, each with
 * the number of nodes, an example selector and the rule's family. A violation carries axe's impact as
 * its severity; a needs-review result is advisory. A best-practice rule maps to no WCAG criterion.
 *
 * @param {{violations: object[], incomplete: object[]}} results The axe results.
 * @returns {object[]} The records.
 */
export function discoveryFindings({ violations = [], incomplete = [] }) {
  const records = new Map();
  const add = (kind, rule, node, reason) => {
    const selector = targetFingerprint(node.target ?? [], node.html ?? '');
    const key = [kind, rule.id, selector, kind === 'axe-needs-review' ? reason : ''].join('|');
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
      reason: kind === 'axe-violation' ? rule.help : `${rule.help}: ${reason}`,
    });
  };

  for (const rule of violations) {
    for (const node of rule.nodes ?? []) {
      add('axe-violation', rule, node, '');
    }
  }
  for (const rule of incomplete) {
    for (const node of rule.nodes ?? []) {
      add('axe-needs-review', rule, node, nodeReason(node));
    }
  }

  return [...records.values()];
}
