/**
 * The sticky pull request comment of the axe scan: the pure half.
 *
 * `tests/scripts/a11y-pr-comment.mjs` posts the body built here on every pull request the scan
 * ran on, or edits the comment it posted before (`upsertComment()`, which finds it by
 * `COMMENT_MARKER` and the Actions bot as its author), so a clean pull request shows the scan
 * too. A clean body is short: the headline, the scan and the links; a body that needs action
 * lists the findings as well. Both end with the findings by rule as a chart of text bars
 * (`textBar()`), the HTML report's overview in a form a comment can hold. The comment carries no
 * screenshot: it links the HTML report, where every element is located.
 *
 * The scan is compared with the pull request's own baseline, so a pull request that adds entries
 * to it reads as clean. `baselineGrowth()` compares the base commit's baseline (`baseCommit()`,
 * `readBaseBaseline()`) with the pull request's, and the comment lists what the pull request
 * added or raised, by issue: debt it accepts, in front of the reviewer. The check run does not
 * read the base; it judges the scan alone.
 *
 * The ClickUp GitHub integration attaches every task id it finds in a pull request
 * comment, permanently (root `AGENTS.md`, one-id rule). The comment prints issue
 * titles, which `validateBaseline()` keeps free of task ids, and every value it
 * prints also goes through `neutralizeTaskIds()`, so a task id from anywhere still
 * cannot attach a task. Every value is escaped for markdown (`escapeMarkdownText()`).
 */
import { BASELINE_FILE, entryKey, escapeMarkdownText, findingsByRule, headline, isSafeLink, verdictCounts } from './a11y-baseline.mjs';

export const COMMENT_MARKER = '<!-- a11y-axe-report -->';
// Who posts the comment: a comment with the marker counts as the earlier one only from this author.
const BOT_LOGIN = 'github-actions[bot]';
const BASELINE_PATH = `tests/${BASELINE_FILE}`;
// How many findings the comment lists before it points to the report.
const ROWS_SHOWN = 15;
// How many baseline additions the comment spells out before it points to the diff.
const GROWTH_SHOWN = 10;
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
 * What the pull request adds to the baseline: the entries the base commit's baseline does not
 * have, and the entries whose node count it raises. An entry is keyed as the comparator keys it
 * (page, theme, rule and target). An entry the base has under another issue is moved, not added:
 * renaming or splitting an issue moves every entry it had, and adds no debt. A deleted entry or a
 * lowered count is not growth.
 *
 * @param {{text?: string, error?: string}} base The base commit's baseline file (`readBaseBaseline()`).
 * @param {object|null} head The pull request's baseline, parsed; `null` when it could not be read.
 * @returns {{added: object[], raised: object[], moved: object[]}|{error: string}} The growth, or why it is unknown;
 * a raised entry carries `baseNodes`, a moved one `baseIssue` and `baseIssueTitle`.
 */
export function baselineGrowth(base, head) {
  if (base.error) {
    return { error: base.error };
  }
  if (!Array.isArray(head?.entries)) {
    return { error: 'this pull request\'s baseline could not be read, so it was not compared with the base branch\'s' };
  }

  let document;

  try {
    document = JSON.parse(base.text);
  } catch (error) {
    return { error: `the base branch's baseline is not valid JSON (${error.message})` };
  }
  if (!Array.isArray(document?.entries)) {
    return { error: 'the base branch\'s baseline has no entries list' };
  }

  const baseTitles = new Map((Array.isArray(document.issues) ? document.issues : []).map(issue => [issue?.id, issue?.title]));
  const recorded = new Map(document.entries.map(item => [entryKey(item), item]));
  const added = [];
  const raised = [];
  const moved = [];

  for (const item of head.entries) {
    const before = recorded.get(entryKey(item));

    if (!before) {
      added.push(item);
    } else if (item.nodes > before.nodes) {
      raised.push({ ...item, baseNodes: before.nodes });
    } else if (item.issue !== before.issue) {
      moved.push({ ...item, baseIssue: before.issue, baseIssueTitle: baseTitles.get(before.issue) ?? before.issue });
    }
  }

  return { added, raised, moved };
}

/**
 * The headline's tail when the pull request grows the baseline, or an empty string.
 *
 * @param {object} [growth] What `baselineGrowth()` returned.
 * @returns {string} The tail.
 */
function growthHeadline(growth) {
  if (!growth || growth.error || growth.added.length + growth.raised.length === 0) {
    return '';
  }

  const parts = [[growth.added.length, 'added'], [growth.raised.length, 'raised']]
    .filter(([count]) => count > 0).map(([count, label]) => `${count} ${label}`);

  return ` · this pull request grows the baseline: ${parts.join(', ')}`;
}

/**
 * The baseline growth section: the additions by issue, then the first few spelled out, raised
 * counts first (a known finding that spread is the change a diff hides best: one number), then the
 * entries moved to another issue. A growth that could not be read is one line that says so.
 *
 * @param {object} [growth] What `baselineGrowth()` returned.
 * @param {Map<string, string>} titles The issue titles by id.
 * @param {(value: string) => string} text The escaping every value goes through.
 * @returns {string[]} Markdown lines, none when there is nothing to say.
 */
function renderGrowth(growth, titles, text) {
  if (!growth) {
    return [];
  }
  if (growth.error) {
    return ['', `> **Baseline growth unknown:** ${text(growth.error)}, so this comment cannot say whether this pull request adds findings to the baseline.`];
  }

  const rows = [
    ...growth.raised.map(item => [item, `${item.nodes} (was ${item.baseNodes})`]),
    ...growth.added.map(item => [item, String(item.nodes)]),
  ];

  if (rows.length === 0) {
    return renderMoves(growth.moved ?? [], titles, text);
  }

  const byIssue = new Map();
  const count = (item, field) => {
    const row = byIssue.get(item.issue) ?? { title: titles.get(item.issue) ?? item.issue, added: 0, raised: 0 };

    row[field] += 1;
    byIssue.set(item.issue, row);
  };

  growth.added.forEach(item => count(item, 'added'));
  growth.raised.forEach(item => count(item, 'raised'));

  const lines = [
    '', '#### Added to the baseline in this pull request', '',
    `These findings are in this pull request's \`${BASELINE_PATH}\` and not in the base branch's, or with a higher count there, `
      + 'so the scan counts them as known. Approving this pull request accepts them as known debt.',
    '', '| Known issue | Added | Raised |', '|---|--:|--:|',
  ];

  for (const row of [...byIssue.values()].sort((a, b) => (b.added + b.raised) - (a.added + a.raised) || a.title.localeCompare(b.title))) {
    lines.push(`| ${text(row.title)} | ${row.added} | ${row.raised} |`);
  }
  lines.push('', '| Page | Theme | Rule | Element | Elements | Known issue |', '|---|---|---|---|---|---|');
  for (const [item, elements] of rows.slice(0, GROWTH_SHOWN)) {
    lines.push(`| ${text(item.page)} | ${text(item.theme)} | ${text(item.rule)} | <code>${text(item.target)}</code> | ${elements} `
      + `| ${text(titles.get(item.issue) ?? item.issue)} |`);
  }
  if (rows.length > GROWTH_SHOWN) {
    lines.push('', `…and ${rows.length - GROWTH_SHOWN} more in this pull request's diff of \`${BASELINE_PATH}\`; `
      + 'the HTML report locates each one under its known issue.');
  }

  return [...lines, ...renderMoves(growth.moved ?? [], titles, text)];
}

/**
 * The line for the entries the pull request moved to another issue, by where they went. An issue
 * renamed or split moves its entries without adding debt, so they are not in the growth.
 *
 * @param {object[]} moved The moved entries (`baselineGrowth()`).
 * @param {Map<string, string>} titles The issue titles by id.
 * @param {(value: string) => string} text The escaping every value goes through.
 * @returns {string[]} Markdown lines, none when nothing moved.
 */
function renderMoves(moved, titles, text) {
  if (moved.length === 0) {
    return [];
  }

  const pairs = new Map();

  for (const item of moved) {
    const key = `${item.baseIssue}|${item.issue}`;
    const pair = pairs.get(key) ?? { from: item.baseIssueTitle, to: titles.get(item.issue) ?? item.issue, count: 0 };

    pair.count += 1;
    pairs.set(key, pair);
  }

  const parts = [...pairs.values()]
    .map(({ from, to, count }) => `${count} ${count === 1 ? 'entry' : 'entries'} from ${text(from)} to ${text(to)}`);

  return ['', `> **Moved between issues,** which adds no debt: ${parts.join('; ')}.`];
}

/**
 * The line under the lead: how many scans ran on how many pages and themes, with which axe-core,
 * and that the pull request adds nothing to the baseline when the base commit's baseline says so.
 *
 * @param {object} comparison The reporter's comparison (`scans`, `scannedPages`, `scannedThemes`, `engines`).
 * @param {object} [growth] What `baselineGrowth()` returned.
 * @param {(value: string) => string} text The escaping every value goes through.
 * @returns {string} The line, empty when there is nothing to say.
 */
function scanLine(comparison, growth, text) {
  const shape = comparison.scannedPages && comparison.scannedThemes
    ? ` (${comparison.scannedPages} pages × ${comparison.scannedThemes} themes)`
    : '';
  const scans = comparison.scans === undefined
    ? ''
    : `${comparison.scans} scans${shape}, axe-core ${text((comparison.engines ?? []).join(', ') || 'none')}.`;
  const unchanged = growth && !growth.error && growth.added.length + growth.raised.length === 0
    ? 'This pull request adds nothing to the baseline.'
    : '';

  return [scans, unchanged].filter(Boolean).join(' ');
}

/**
 * The comment's body, marker first.
 *
 * @param {object} comparison The reporter's comparison (a verdict with `problems`).
 * @param {object} [links] Where to point.
 * @param {string} [links.reportUrl] The HTML report.
 * @param {string} [links.runUrl] The workflow run.
 * @param {string} [links.checkUrl] The check run.
 * @param {object} [links.growth] What `baselineGrowth()` returned; without it the comment says nothing about growth.
 * @returns {string} Markdown.
 */
export function renderComment(comparison, { reportUrl, runUrl, checkUrl, growth } = {}) {
  const counts = verdictCounts(comparison);
  const problems = comparison.problems ?? [];
  const text = value => neutralizeTaskIds(escapeMarkdownText(value));
  const titles = new Map((comparison.issues ?? []).map(issue => [issue.id, issue.title]));
  const tail = growthHeadline(growth);
  const mark = problems.length > 0 || (counts.action > 0 && comparison.mode === 'block') ? '❌' : (counts.action > 0 || tail ? '⚠️' : '✅');
  const lines = [COMMENT_MARKER, `### ♿ A11y / axe: ${mark} ${text(headline(comparison))}${tail}`, ''];

  if (counts.action > 0) {
    lines.push(comparison.mode === 'block'
      ? 'Block mode: these findings fail the job until the code or the baseline changes.'
      : 'Warn mode: these findings never block the merge. Fix them, or change the baseline as each remedy in the report says.');
  } else {
    lines.push('Nothing needs action: every finding is in the baseline with its recorded count.');
  }

  const scan = scanLine(comparison, growth, text);

  if (scan) {
    lines.push('', scan);
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
  lines.push(...renderGrowth(growth, titles, text));
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

/**
 * The commit to read the base baseline at: the first parent of the commit the job checked out. On
 * a pull request that is the merge commit, and its first parent is the base branch tip it merged
 * into, so the two baselines differ by this pull request's changes alone. The payload's
 * `base.sha` can be older than that tip (a re-run replays the old payload against a rebuilt merge
 * ref, and a branch that merged the base in after it forked has the same shape), and every base
 * commit in between would read as growth (`.ai/CI.md`), so it is only the fallback for a checkout
 * that is not a merge commit. A failed read is an error, never a guess.
 *
 * @param {object} input The request.
 * @param {Function} input.request The REST client, as `readBaseBaseline()` takes it.
 * @param {string} input.repoApi The repository's API URL.
 * @param {string} [input.checkedOut] The commit the job checked out (`A11Y_CHECKOUT_SHA`).
 * @param {string} [input.payloadBase] The pull request's base commit from the event (`A11Y_BASE_SHA`).
 * @returns {Promise<{sha?: string}|{error: string}>} The commit, or why it is unknown.
 */
export async function baseCommit({ request, repoApi, checkedOut, payloadBase }) {
  if (!checkedOut) {
    return { sha: payloadBase };
  }

  let commit;

  try {
    commit = await request(`${repoApi}/commits/${encodeURIComponent(checkedOut)}`);
  } catch (error) {
    return { error: `reading the checked-out commit ${checkedOut.slice(0, 12)} ${error.status ? `answered ${error.status}` : `failed (${error.message})`}` };
  }

  return { sha: commit.parents?.length === 2 ? commit.parents[0].sha : payloadBase };
}

/**
 * Reads the base commit's baseline through the contents API, raw, so a file of any size arrives
 * whole (the JSON shape cuts the content off above 1 MB).
 *
 * @param {object} input The request.
 * @param {Function} input.request The REST client: `(url, {method, payload, raw})`, rejecting with
 * an error that carries `status` on an error status.
 * @param {string} input.repoApi The repository's API URL.
 * @param {string} [input.sha] The base commit.
 * @returns {Promise<{text: string}|{error: string}>} The file's text, or why there is none.
 */
export async function readBaseBaseline({ request, repoApi, sha }) {
  if (!sha) {
    return { error: 'no base commit was given (A11Y_BASE_SHA)' };
  }

  try {
    return { text: await request(`${repoApi}/contents/${BASELINE_PATH}?ref=${encodeURIComponent(sha)}`, { raw: true }) };
  } catch (error) {
    if (error.status === 404) {
      return { error: `the base commit ${sha.slice(0, 12)} has no ${BASELINE_PATH}` };
    }

    return { error: `reading the base commit's ${BASELINE_PATH} ${error.status ? `answered ${error.status}` : `failed (${error.message})`}` };
  }
}

/**
 * Edits the comment posted on an earlier run, or posts one when there is none, whatever the run
 * found: every pull request the scan ran on shows it. The earlier comment is the Actions bot's own
 * with `COMMENT_MARKER` in it; anyone can paste the marker, so the author decides.
 *
 * @param {object} input The request.
 * @param {Function} input.request The REST client, as `readBaseBaseline()` takes it.
 * @param {string} input.repoApi The repository's API URL.
 * @param {string|number} input.prNumber The pull request.
 * @param {string} input.body The comment's body.
 * @returns {Promise<{action: 'edited'|'posted', url: string}>} What was done, and where.
 */
export async function upsertComment({ request, repoApi, prNumber, body }) {
  let existing = null;

  for (let page = 1; !existing; page += 1) {
    const comments = await request(`${repoApi}/issues/${prNumber}/comments?per_page=100&page=${page}`);

    existing = comments.find(comment => comment.user?.login === BOT_LOGIN && comment.body?.includes(COMMENT_MARKER)) ?? null;
    if (comments.length < 100) {
      break;
    }
  }

  if (existing) {
    await request(`${repoApi}/issues/comments/${existing.id}`, { method: 'PATCH', payload: { body } });

    return { action: 'edited', url: existing.html_url };
  }

  const created = await request(`${repoApi}/issues/${prNumber}/comments`, { method: 'POST', payload: { body } });

  return { action: 'posted', url: created.html_url };
}
