/**
 * The sticky pull request comment of the axe scan: the pure half.
 *
 * `tests/scripts/a11y-pr-comment.mjs` posts the body built here on the pull request,
 * or edits the comment it posted before (found by `COMMENT_MARKER` and the Actions
 * bot as its author). It posts a new comment only when something needs action or a
 * tooling problem showed; when a later run is clean it edits the old comment to say
 * so, and it never posts a clean one. The comment carries no screenshot: it links the
 * HTML report, where every element is located. It ends with the findings by rule as a chart of
 * text bars (`textBar()`), the HTML report's overview in a form a comment can hold.
 *
 * The ClickUp GitHub integration attaches every task id it finds in a pull request
 * comment, permanently (root `AGENTS.md`, one-id rule). The comment prints issue
 * titles, which `validateBaseline()` keeps free of task ids, and every value it
 * prints also goes through `neutralizeTaskIds()`, so a task id from anywhere still
 * cannot attach a task. Every value is escaped for markdown (`escapeMarkdownText()`).
 */
import { escapeMarkdownText, findingsByRule, headline, isSafeLink, verdictCounts } from './a11y-baseline.mjs';

export const COMMENT_MARKER = '<!-- a11y-axe-report -->';
// How many findings the comment lists before it points to the report.
const ROWS_SHOWN = 15;
// How many rules the chart shows before it points to the report, and how many characters its
// longest bar takes.
const RULES_SHOWN = 12;
const BAR_WIDTH = 20;
const LABELS = { new: '✖ New', grown: '▲ Grown', improved: '▼ Improved', fixed: '✔ Fixed' };
// The partial blocks of a text bar, one eighth of a character each.
const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'];

/**
 * A bar drawn with block characters, `value / max` of `width` characters long, to an eighth of a
 * character. A comment cannot hold a picture GitHub fetches without a login or a script, and a
 * Mermaid chart renders in a frame a screen reader cannot read; text bars render everywhere,
 * notification emails included. The number in the column before the bar carries the value, and
 * the bar sits in a column of its own (`Chart`) that a screen reader can skip: GitHub strips
 * `aria-hidden` from comment HTML, so the bar cannot be hidden from one.
 *
 * @param {number} value The value.
 * @param {number} max The value the longest bar stands for.
 * @param {number} [width] The longest bar, in characters.
 * @returns {string} The bar; at least one eighth for any value above zero.
 */
export function textBar(value, max, width = BAR_WIDTH) {
  if (!(value > 0) || !(max > 0)) {
    return '';
  }

  const eighths = Math.max(1, Math.round((Math.min(value, max) / max) * width * 8));

  return `${'█'.repeat(Math.floor(eighths / 8))}${EIGHTHS[eighths % 8]}`;
}

/**
 * The findings-by-rule chart: one row per rule with its findings as a bar, its elements and what
 * of it needs action, the way the HTML report's overview draws it.
 *
 * @param {object} comparison The reporter's comparison.
 * @param {(value: string) => string} text The escaping every value goes through.
 * @returns {string[]} Markdown lines, none when the run found nothing.
 */
function renderRuleChart(comparison, text) {
  const rules = findingsByRule(comparison);

  if (rules.length === 0) {
    return [];
  }

  const lines = [
    '', '#### Findings by rule', '',
    'A finding is one rule on one kind of element, on one page and theme.', '',
    '| Rule | Findings | Chart | Elements | Needs action |', '|---|--:|---|--:|---|',
  ];

  for (const row of rules.slice(0, RULES_SHOWN)) {
    const action = [
      row.new ? `✖ ${row.new} new` : '',
      row.grown ? `▲ ${row.grown} grown` : '',
      row.improved ? `▼ ${row.improved} improved` : '',
    ].filter(Boolean).join(', ');

    lines.push(`| <code>${text(row.rule)}</code> | ${row.findings} | ${textBar(row.findings, rules[0].findings)} `
      + `| ${row.nodes} | ${action || '–'} |`);
  }
  if (rules.length > RULES_SHOWN) {
    lines.push('', `…and ${rules.length - RULES_SHOWN} more rules in the report.`);
  }

  return lines;
}

/**
 * Breaks anything shaped like a task id (`DEV-1234`) with a non-breaking hyphen, which reads the
 * same and which the ClickUp integration does not match.
 *
 * @param {string} text The text.
 * @returns {string} The text.
 */
export function neutralizeTaskIds(text) {
  return String(text).replace(/\b([A-Z][A-Z0-9]*)-(\d+)\b/g, '$1‑$2');
}

/**
 * Whether a run earns a new comment: something needs action, or the tooling failed.
 *
 * @param {object} comparison The reporter's comparison.
 * @returns {boolean} Whether to post.
 */
export function shouldComment(comparison) {
  return verdictCounts(comparison).action > 0 || (comparison.problems ?? []).length > 0;
}

/**
 * The comment's body, marker first.
 *
 * @param {object} comparison The reporter's comparison (a verdict with `problems`).
 * @param {object} [links] Where to point.
 * @param {string} [links.reportUrl] The HTML report.
 * @param {string} [links.runUrl] The workflow run.
 * @param {string} [links.checkUrl] The check run.
 * @returns {string} Markdown.
 */
export function renderComment(comparison, { reportUrl, runUrl, checkUrl } = {}) {
  const counts = verdictCounts(comparison);
  const problems = comparison.problems ?? [];
  const text = value => neutralizeTaskIds(escapeMarkdownText(value));
  const titles = new Map((comparison.issues ?? []).map(issue => [issue.id, issue.title]));
  const mark = problems.length > 0 || (counts.action > 0 && comparison.mode === 'block') ? '❌' : (counts.action > 0 ? '⚠️' : '✅');
  const lines = [COMMENT_MARKER, `### ♿ A11y / axe: ${mark} ${text(headline(comparison))}`, ''];

  if (counts.action > 0) {
    lines.push(comparison.mode === 'block'
      ? 'Block mode: these findings fail the job until the code or the baseline changes.'
      : 'Warn mode: these findings never block the merge. Fix them, or change the baseline as each remedy in the report says.');
  } else {
    lines.push('Nothing needs action: every finding is in the baseline with its recorded count.');
  }
  if (isSafeLink(reportUrl)) {
    lines.push('', `📊 **[Open the HTML report](${reportUrl})** to locate each element: the fixture to open, the steps, the selector, the DOM path and a screenshot.`);
  }
  for (const problem of problems) {
    lines.push('', `> **Tooling problem:** ${text(problem)}`);
  }

  const rows = [
    ...comparison.newViolations.map(item => ['new', item, item.suggestedIssue]),
    ...comparison.grown.map(item => ['grown', item, item.issue]),
    ...comparison.improved.map(item => ['improved', item, item.issue]),
    ...comparison.stale.map(item => ['fixed', item, item.issue]),
  ];

  if (rows.length > 0) {
    lines.push('', '| | Page | Theme | Rule | Element | Elements | Known issue |', '|---|---|---|---|---|---|---|');
    for (const [status, item, issue] of rows.slice(0, ROWS_SHOWN)) {
      const elements = status === 'grown' || status === 'improved' ? `${item.nodes} (was ${item.baselineNodes})` : String(item.nodes);

      lines.push(`| ${LABELS[status]} | ${text(item.page)} | ${text(item.theme)} | ${text(item.rule)} | <code>${text(item.target)}</code> `
        + `| ${elements} | ${issue ? text(titles.get(issue) ?? issue) : '–'} |`);
    }
    if (rows.length > ROWS_SHOWN) {
      lines.push('', `…and ${rows.length - ROWS_SHOWN} more in the report.`);
    }
  }
  lines.push(...renderRuleChart(comparison, text));

  const footer = [
    isSafeLink(runUrl) ? `[Workflow run](${runUrl})` : '',
    isSafeLink(checkUrl) ? `[Check run](${checkUrl})` : '',
    'baseline: `tests/a11y/axe-baseline.json`',
    'for agents: `a11y-findings.json` in the `a11y-axe-results` artifact',
  ].filter(Boolean);

  lines.push('', `<sub>${footer.join(' · ')}</sub>`, '');

  return lines.join('\n');
}
