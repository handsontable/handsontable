/**
 * The input for the stock axe HTML report (`axe-html-reporter`): the pure half.
 *
 * `axe-html-reporter` renders one set of axe results. The scan has one per page and
 * theme, so `combineScans()` folds them into one, rule by rule, and prefixes every
 * node's location with the page and theme it was found on; the report then shows
 * every finding of the run in one file a pull request can link to.
 * `summaryHtml()` is the comparison with the baseline, for the report's summary
 * slot. The reporter (`tests/reporters/a11y.ts`) passes both to `createHtmlReport()`.
 * No I/O in here.
 *
 * The summary slot is the one place `axe-html-reporter` writes HTML unescaped, so
 * every value that goes into it is escaped here. This module does not import
 * `axe-html-reporter`: the root `test:tooling` suite runs its tests with no install.
 */
import { headline, verdictCounts } from './a11y-baseline.mjs';

/**
 * Escapes text for HTML content and attribute values.
 *
 * @param {unknown} value The value.
 * @returns {string} The escaped text.
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
}

/**
 * Folds one list of results (violations or incomplete) from every scan into one list, rule by
 * rule, with each node's location prefixed by its scan. The rules are ordered by node count.
 *
 * @param {object[]} scans The scans.
 * @param {'violations'|'incomplete'} list Which list.
 * @returns {object[]} The folded results.
 */
function fold(scans, list) {
  const byRule = new Map();

  for (const scan of scans) {
    for (const result of scan[list] ?? []) {
      const folded = byRule.get(result.id) ?? { ...result, nodes: [] };

      folded.nodes.push(...(result.nodes ?? []).map(node => ({
        ...node,
        target: [`${scan.page} · ${scan.theme} › ${(node.target ?? []).map(part => (Array.isArray(part) ? part.join(' >>> ') : part)).join(' ')}`],
      })));
      byRule.set(result.id, folded);
    }
  }

  return [...byRule.values()].sort((a, b) => b.nodes.length - a.nodes.length || a.id.localeCompare(b.id));
}

/**
 * Every scan's results as one set, in the shape `axe-html-reporter` takes.
 *
 * @param {object[]} scans The scans the run completed, as the spec writes them.
 * @param {string} [url] The page the report links its title to (the workflow run).
 * @returns {object} The combined results.
 */
export function combineScans(scans, url) {
  return {
    url,
    testEngine: { name: 'axe-core', version: [...new Set(scans.map(scan => scan.axeCoreVersion))].sort().join(', ') },
    violations: fold(scans, 'violations'),
    incomplete: fold(scans, 'incomplete'),
    // The report lists passes and inapplicable rules too; the scans do not keep them (they would
    // multiply the report's size for nothing to act on), and the reporter needs the lists to exist.
    passes: [],
    inapplicable: [],
  };
}

/**
 * The comparison with the baseline, for the report's summary slot: the headline, every finding
 * that needs action with its remedy, and the known issues. Every value is escaped.
 *
 * @param {object} verdict What `compareViolations()` returned.
 * @param {object} context The run.
 * @param {number} context.scans How many scans completed.
 * @param {string[]} [context.problems] Tooling problems.
 * @param {string[]} [context.notes] Notes, such as an engine version drift.
 * @returns {string} HTML.
 */
export function summaryHtml(verdict, { scans, problems = [], notes = [] }) {
  const counts = verdictCounts(verdict);
  const action = [
    ...verdict.newViolations.map(item => ['New', item]),
    ...verdict.grown.map(item => ['Grown', item]),
    ...verdict.improved.map(item => ['Improved', item]),
    ...verdict.stale.map(item => ['Fixed', item]),
  ];
  const lines = [
    `<p><strong>${escapeHtml(headline(verdict))}</strong></p>`,
    `<p>${escapeHtml(`${verdict.mode === 'block' ? 'Block' : 'Warn'} mode. ${scans} scans compared with tests/a11y/axe-baseline.json: `
      + `${counts.new} new, ${counts.grown} grown, ${counts.matched} matched, ${counts.improved} improved, ${counts.stale} fixed, `
      + `${counts.unverified} not scanned. The violations below are every finding of the run, known ones included; `
      + 'each location starts with its page and theme.')}</p>`,
  ];

  for (const text of [...problems.map(problem => `Tooling problem: ${problem}`), ...notes]) {
    lines.push(`<p><strong>${escapeHtml(text)}</strong></p>`);
  }
  if (action.length > 0) {
    lines.push('<p>Needs action:</p><ul>', ...action.map(([label, item]) => `<li><strong>${label}</strong>: `
      + `${escapeHtml(`${item.rule} on ${item.target}, ${item.page} on ${item.theme}. ${item.remedy}`)}</li>`), '</ul>');
  }
  if (verdict.issues.length > 0) {
    lines.push('<p>Known issues:</p><ul>', ...verdict.issues.map((issue) => {
      const found = issue.counts.matched + issue.counts.grown + issue.counts.improved;

      return `<li>${escapeHtml(`${issue.title} (${issue.id}): ${found} finding${found === 1 ? '' : 's'}`)}</li>`;
    }), '</ul>');
  }

  return lines.join('\n');
}
