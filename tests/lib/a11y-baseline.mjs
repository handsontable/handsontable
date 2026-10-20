/**
 * The axe baseline ratchet: the pure half.
 *
 * `tests/a11y/axe.spec.ts` runs axe-core over a curated set of fixture pages on
 * the three themes and attaches each scan. The reporter (`tests/reporters/a11y.ts`)
 * flattens the scans into findings (`findingsFromScan()`), compares them with the
 * committed baseline (`tests/a11y/axe-baseline.json`) through
 * `compareViolations()`, and renders the job summary, the annotations, the check
 * run and the stock axe HTML report's summary from what comes back. No I/O in here. The policy is
 * written up in `tests/AGENTS.md` ("A11y: the axe scan and its baseline").
 *
 * The baseline has two lists. `issues` is the catalog of known accessibility
 * problems: a stable id local to this repository (`menu-roles`), a title, and
 * optionally the tracker task that owns the fix. `entries` is where each issue
 * shows: one entry per page, theme, rule and target, with the number of nodes
 * that carried it. An entry names its issue, never a tracker task directly, so
 * the gate does not depend on a task's lifecycle: a task closed for any reason
 * leaves no entry pointing at it, and a new finding can be baselined under an
 * issue before anyone files a task for it.
 *
 * A finding is keyed by page, theme, rule and target. The target is what the
 * node is, read from its own start tag (`targetFingerprint()`), so the same
 * element keys the same on every page whatever selector axe picked to reach it.
 * The comparison sorts a run into six sets:
 *
 * - new: a key not in the baseline. Fix it, or add an entry (under a known issue
 *   when the rule and target match one, which the finding then names).
 * - grown: a baseline key carried by more nodes than the entry records. A
 *   regression that spreads a known finding; fix the new nodes or raise `nodes`.
 * - matched: a baseline key carried by exactly the recorded number of nodes.
 * - improved: a baseline key carried by fewer nodes than recorded. Lower `nodes`.
 * - stale: a baseline entry whose page and theme were scanned and which did not
 *   reproduce. Delete it, and its issue with its last entry.
 * - unverified: a baseline entry whose page or theme was not scanned this run.
 *
 * `A11Y_MODE` is the one-line switch: `warn` keeps the job green whatever the
 * sets hold (every report still shows them), `block` fails the run on a new,
 * grown, improved or stale finding, so the baseline only ever moves with the
 * code. The flip comes after a replay over recent pull requests shows the
 * comparator is precise.
 */

export const A11Y_MODES = ['warn', 'block'];
export const A11Y_MODE = 'warn';
export const A11Y_THEMES = ['main', 'horizon', 'classic'];
export const BASELINE_FILE = 'a11y/axe-baseline.json';
// The sets that need a change to the code or the baseline, and so fail a run in block mode.
export const ACTION_SETS = ['newViolations', 'grown', 'improved', 'stale'];

const TRACKER_ID = /^[A-Z][A-Z0-9]*-\d+$/;
const ISSUE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const ENTRY_FIELDS = new Set(['page', 'theme', 'rule', 'target', 'impact', 'nodes', 'issue']);
const ISSUE_FIELDS = new Set(['id', 'title', 'tracker']);
const IMPACTS = new Set(['minor', 'moderate', 'serious', 'critical']);
const KEY_FIELDS = ['page', 'theme', 'rule', 'target'];
const START_TAG = /^<([a-z][a-z0-9-]*)([^>]*)>/i;
// Classes that say which instance, theme, state or layout rendered a node rather than what the
// node is: a key built on one would change with the selection, the scroll position or the
// platform. `htDisabled` is the measured case: a menu item is disabled or not depending on what
// is selected when the menu opens.
const VOLATILE_CLASSES = new Set([
  'handsontable', 'current', 'area', 'highlight', 'fill', 'htDisabled', 'htDimmed', 'htInvalid',
  'htCustomMenuRenderer', 'htSelectionDisabled', 'htMacScroll', 'htScrollbarHidden',
  'afterHiddenRow', 'afterHiddenColumn', 'beforeHiddenRow', 'beforeHiddenColumn',
  'firstVisibleRow', 'firstVisibleColumn', 'ht__highlight', 'ht__active_highlight', 'ht__row_odd', 'ht__row_even',
]);
// A generated instance class or id (`ht_<random>`, `wt_<random>`), a theme class, or a token axe
// truncated (`handsonta...`).
const NON_DESCRIPTIVE_TOKEN = /^(ht|wt)_|^ht-theme-|\.\.\.$/;
// The fallback when axe gives no start tag: the selector's last compound, with positional indexes
// collapsed, attribute values other than `role` and `type` dropped, and generated ids collapsed.
const POSITIONAL_INDEX = /:nth-(child|of-type|last-child|last-of-type)\(\d+\)/g;
const ATTRIBUTE_WITH_VALUE = /\[([^\]=~|^$*]+)[~|^$*]?="(?:[^"\\]|\\.)*"\]/g;
const GENERATED_ID = /#(ht|wt)_[0-9a-f]+[\w-]*/g;
const COMBINATOR = /\s*[>+~]\s*|\s+/;
// What markdown or HTML reads inside a table cell (`escapeMarkdownText()`).
const MARKDOWN_SPECIAL = /[\\`*_[\]<>&|~$]/g;
// A help URL the summary links: https, and none of the characters that end a link destination or a
// table cell. axe's own `helpUrl` always qualifies; anything else is shown as text.
const SAFE_HELP_URL = /^https:\/\/[^\s()<>|\\`"']+$/;
// axe tags a WCAG success criterion as `wcag` plus its digits (`wcag412` is 4.1.2).
const WCAG_TAG = /^wcag(\d)(\d)(\d+)$/;

/**
 * The key a finding and a baseline entry are matched on.
 *
 * @param {{page: string, theme: string, rule: string, target: string}} item The finding or entry.
 * @returns {string} The key.
 */
export function entryKey(item) {
  return KEY_FIELDS.map(field => item[field]).join('|');
}

/**
 * The stable target of an axe result node: what the node is, read from its own
 * start tag (axe's `html`), so the key does not depend on the selector axe picked
 * to reach it, which changes with the rest of the page. It is the tag, the first
 * class that describes the node with that class's BEM modifiers, and the `role`
 * and `type` attributes: `td.htSeparator[role="menuitem"]`,
 * `button.ht-button.ht-button--primary`, `textarea.handsontableInput`. Classes for
 * state, layout or instance (`current`, `htDisabled`, `ht_<random>`) are skipped.
 *
 * When axe gives no start tag, the fallback is the selector's own last compound,
 * with positional indexes collapsed and attribute values other than `role` and
 * `type` dropped.
 *
 * @param {Array<string|string[]>} target The `target` of an axe result node.
 * @param {string} [html] The node's `html` from the same axe result node.
 * @returns {string} The fingerprint.
 */
export function targetFingerprint(target, html = '') {
  return describeNode(html) ?? selectorFingerprint(target);
}

/**
 * What a node is, from its start tag, or `null` when the text is not one.
 *
 * @param {string} html The node's markup, starting with its start tag.
 * @returns {string|null} The descriptor.
 */
function describeNode(html) {
  const match = START_TAG.exec(html ?? '');

  if (!match) {
    return null;
  }

  const attributes = match[2];
  const classes = (readAttribute(attributes, 'class') ?? '').trim().split(/\s+/);
  const descriptive = name => name !== '' && !VOLATILE_CLASSES.has(name) && !NON_DESCRIPTIVE_TOKEN.test(name);
  const first = classes.find(descriptive);
  const modifiers = first ? classes.filter(name => name.startsWith(`${first}--`) && descriptive(name)) : [];
  const role = readAttribute(attributes, 'role');
  const type = readAttribute(attributes, 'type');

  return [
    match[1].toLowerCase(),
    ...[first, ...modifiers].filter(Boolean).map(name => `.${name}`),
    role ? `[role="${role}"]` : '',
    type ? `[type="${type}"]` : '',
  ].join('');
}

/**
 * The fallback fingerprint from axe's selector.
 *
 * @param {Array<string|string[]>} target The `target` of an axe result node.
 * @returns {string} The fingerprint.
 */
function selectorFingerprint(target) {
  const last = target.at(-1);
  const selector = Array.isArray(last) ? last.at(-1) : last;

  return String(selector ?? '')
    .replace(ATTRIBUTE_WITH_VALUE, (whole, name) => (['role', 'type'].includes(name) ? whole : `[${name}]`))
    .trim()
    .split(COMBINATOR)
    .at(-1)
    .replace(POSITIONAL_INDEX, ':nth-$1(n)')
    .replace(GENERATED_ID, '#$1_*');
}

/**
 * One attribute's value from a start tag's attribute text.
 *
 * @param {string} attributes The text between the tag name and `>`.
 * @param {string} name The attribute.
 * @returns {string|undefined} The value.
 */
function readAttribute(attributes, name) {
  return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes)?.[1];
}

/**
 * The WCAG success criteria an axe rule's tags name, as `4.1.2`.
 *
 * @param {string[]} tags The rule's tags.
 * @returns {string[]} The criteria, in tag order.
 */
export function wcagCriteria(tags = []) {
  return tags.map(tag => WCAG_TAG.exec(tag)).filter(Boolean).map(([, a, b, c]) => `${a}.${b}.${c}`);
}

/**
 * The findings of one scan: one per violation node, keyed by the node's
 * fingerprint. `compareViolations()` folds the nodes that share a key.
 *
 * @param {{page: string, theme: string, violations: object[]}} scan A scan as the spec writes it.
 * @returns {object[]} The findings.
 */
export function findingsFromScan(scan) {
  return scan.violations.flatMap(violation => violation.nodes.map(node => ({
    page: scan.page,
    theme: scan.theme,
    rule: violation.id,
    target: targetFingerprint(node.target, node.html),
    impact: violation.impact ?? null,
    help: violation.help,
    helpUrl: violation.helpUrl,
    wcag: wcagCriteria(violation.tags),
    html: node.html,
    selector: node.target,
    failureSummary: node.failureSummary ?? '',
    nodes: 1,
  })));
}

/**
 * Why the baseline document is not acceptable: one line per problem, empty when
 * it is. Run by the tooling test on the committed file and by the reporter
 * before it compares, so a malformed entry is a red run, never a silently
 * matched one.
 *
 * @param {unknown} document The parsed `axe-baseline.json`.
 * @param {{pages: string[]}} known The page ids the scan knows.
 * @returns {string[]} The problems.
 */
export function validateBaseline(document, { pages }) {
  if (document === null || typeof document !== 'object' || Array.isArray(document)) {
    return ['the baseline must be a JSON object with "axeCoreVersion", "issues" and "entries"'];
  }

  const problems = [];

  if (typeof document.axeCoreVersion !== 'string' || !SEMVER.test(document.axeCoreVersion)) {
    problems.push('"axeCoreVersion" must be the exact axe-core version the baseline was taken with (x.y.z)');
  }
  if (!Array.isArray(document.issues)) {
    problems.push('"issues" must be an array: the catalog of known problems the entries name');
  }
  if (!Array.isArray(document.entries)) {
    problems.push('"entries" must be an array');
  }
  if (problems.length > 0 && (!Array.isArray(document.issues) || !Array.isArray(document.entries))) {
    return problems;
  }

  const issueIds = validateIssues(document.issues, problems);
  const used = new Map([...issueIds].map(id => [id, 0]));

  validateEntries(document.entries, { pages, issueIds, used, problems });
  for (const [id, count] of used) {
    if (count === 0) {
      problems.push(`issue "${id}" has no entry left: it is fixed, so delete it from "issues" (and close its tracker)`);
    }
  }

  return problems;
}

/**
 * Checks the issue catalog and returns the ids it declares.
 *
 * @param {unknown[]} issues The catalog.
 * @param {string[]} problems Where a problem goes.
 * @returns {Set<string>} The issue ids.
 */
function validateIssues(issues, problems) {
  const ids = new Set();

  issues.forEach((issue, index) => {
    const where = `issue ${index + 1}`;

    if (issue === null || typeof issue !== 'object') {
      problems.push(`${where} is not an object`);

      return;
    }
    for (const field of Object.keys(issue).filter(name => !ISSUE_FIELDS.has(name))) {
      problems.push(`${where} ("${issue.id}"): unknown field "${field}"; an issue has id, title and an optional tracker`);
    }
    if (typeof issue.id !== 'string' || !ISSUE_ID.test(issue.id)) {
      problems.push(`${where}: "id" must be a kebab-case slug (menu-roles), got ${JSON.stringify(issue.id)}`);
    } else if (ids.has(issue.id)) {
      problems.push(`${where}: duplicate issue id "${issue.id}"`);
    } else {
      ids.add(issue.id);
    }
    if (typeof issue.title !== 'string' || issue.title.trim() === '') {
      problems.push(`${where} ("${issue.id}"): "title" must say what the problem is`);
    }
    if (issue.tracker !== undefined && (typeof issue.tracker !== 'string' || !TRACKER_ID.test(issue.tracker))) {
      problems.push(`${where} ("${issue.id}"): "tracker" is optional, and when present it is a task id (DEV-1234), `
        + `got ${JSON.stringify(issue.tracker)}`);
    }
  });

  return ids;
}

/**
 * Checks the entries against the pages and the issue catalog, counting each issue's entries.
 *
 * @param {unknown[]} entries The entries.
 * @param {object} context The pages, the issue ids, the per-issue counts and the problems.
 */
function validateEntries(entries, { pages, issueIds, used, problems }) {
  const seen = new Map();

  entries.forEach((item, index) => {
    const where = `entry ${index + 1}`;

    if (item === null || typeof item !== 'object') {
      problems.push(`${where} is not an object`);

      return;
    }

    const label = `${where} (${describe(item)})`;

    for (const field of Object.keys(item).filter(name => !ENTRY_FIELDS.has(name))) {
      problems.push(`${label}: unknown field "${field}"; an entry has ${[...ENTRY_FIELDS].join(', ')}`
        + (field === 'task' || field === 'note' ? ' (the owner and the description live on the issue now)' : ''));
    }
    for (const field of ['page', 'rule', 'target']) {
      if (typeof item[field] !== 'string' || item[field] === '') {
        problems.push(`${label}: "${field}" must be a non-empty string`);
      }
    }
    if (!A11Y_THEMES.includes(item.theme)) {
      problems.push(`${label}: theme ${JSON.stringify(item.theme)} is not one of ${A11Y_THEMES.join(', ')}`);
    }
    if (typeof item.page === 'string' && item.page !== '' && !pages.includes(item.page)) {
      problems.push(`${label}: page "${item.page}" is not in the scan list (tests/a11y/pages.mjs); `
        + 'delete the entry or restore the page');
    }
    if (item.impact !== undefined && item.impact !== null && !IMPACTS.has(item.impact)) {
      problems.push(`${label}: impact ${JSON.stringify(item.impact)} is not one of axe's (${[...IMPACTS].join(', ')})`);
    }
    if (!Number.isInteger(item.nodes) || item.nodes < 1) {
      problems.push(`${label}: "nodes" must be the number of nodes that carry the finding (a positive integer), `
        + `got ${JSON.stringify(item.nodes)}`);
    }
    if (typeof item.issue !== 'string' || !issueIds.has(item.issue)) {
      problems.push(`${label}: "issue" must name an id from "issues", got ${JSON.stringify(item.issue)}`);
    } else {
      used.set(item.issue, used.get(item.issue) + 1);
    }

    const key = entryKey(item);

    if (seen.has(key)) {
      problems.push(`${where} duplicates entry ${seen.get(key)} (${key})`);
    } else {
      seen.set(key, index + 1);
    }
  });
}

/**
 * Sorts a run's findings against the baseline and decides the run's status in
 * the given mode.
 *
 * @param {object} input The run.
 * @param {object[]} input.baseline The baseline entries (validated already).
 * @param {object[]} [input.issues] The baseline's issue catalog.
 * @param {object[]} input.violations The run's findings (`findingsFromScan()`).
 * @param {Array<{page: string, theme: string}>} input.scanned The page × theme pairs the run completed.
 * @param {'warn'|'block'} input.mode The mode.
 * @returns {object} The verdict: `mode`, `status`, the six sets, and `issues` with each issue's
 * counts in this run.
 */
export function compareViolations({ baseline, issues = [], violations, scanned, mode }) {
  if (!A11Y_MODES.includes(mode)) {
    throw new Error(`Unknown a11y mode ${JSON.stringify(mode)}; expected one of ${A11Y_MODES.join(', ')}`);
  }

  const scannedKeys = new Set(scanned.map(({ page, theme }) => `${page}|${theme}`));
  const byKey = new Map(baseline.map(item => [entryKey(item), item]));
  const issueOfSignature = signatureIndex(baseline);
  const entriesPerIssue = countBy(baseline, item => item.issue);
  const found = foldFindings(violations);
  const sets = { newViolations: [], grown: [], matched: [], improved: [], stale: [], unverified: [] };

  for (const [key, finding] of found) {
    const entry = byKey.get(key);

    if (!entry) {
      const suggestedIssue = issueOfSignature.get(`${finding.rule}|${finding.target}`) ?? null;

      sets.newViolations.push({ ...finding, suggestedIssue, remedy: newRemedy(finding, suggestedIssue) });
    } else if (finding.nodes > entry.nodes) {
      sets.grown.push({ ...finding, issue: entry.issue, baselineNodes: entry.nodes,
        remedy: `${finding.nodes - entry.nodes} more node${finding.nodes - entry.nodes === 1 ? '' : 's'} than the `
          + `${entry.nodes} recorded (${finding.nodes} now): fix the new ones, or raise "nodes" to ${finding.nodes} in tests/${BASELINE_FILE}` });
    } else if (finding.nodes < entry.nodes) {
      sets.improved.push({ ...finding, issue: entry.issue, baselineNodes: entry.nodes,
        remedy: `${entry.nodes - finding.nodes} fewer node${entry.nodes - finding.nodes === 1 ? '' : 's'} than the `
          + `${entry.nodes} recorded: lower "nodes" to ${finding.nodes} in tests/${BASELINE_FILE}` });
    } else {
      sets.matched.push({ ...finding, issue: entry.issue, baselineNodes: entry.nodes, remedy: `known issue "${entry.issue}"` });
    }
  }
  for (const item of baseline) {
    if (found.has(entryKey(item))) {
      continue;
    }
    if (scannedKeys.has(`${item.page}|${item.theme}`)) {
      const last = entriesPerIssue.get(item.issue) === 1;

      sets.stale.push({ ...item, remedy: `delete the entry (${entryKey(item)}) from tests/${BASELINE_FILE}: the finding no longer reproduces`
        + (last ? `; it was the last entry of issue "${item.issue}", so delete the issue too` : '') });
    } else {
      sets.unverified.push({ ...item, remedy: `${item.page} on ${item.theme} was not scanned this run; nothing to do until it runs` });
    }
  }
  for (const list of Object.values(sets)) {
    list.sort((a, b) => entryKey(a).localeCompare(entryKey(b)));
  }

  const failing = mode === 'block' && ACTION_SETS.some(name => sets[name].length > 0);

  return { mode, status: failing ? 'failed' : 'passed', ...sets, issues: issueCounts(issues, sets) };
}

/**
 * Folds findings that share a key into one, summing their nodes and keeping every node's detail.
 *
 * @param {object[]} violations The findings.
 * @returns {Map<string, object>} The folded findings by key.
 */
function foldFindings(violations) {
  const found = new Map();

  for (const item of violations) {
    const key = entryKey(item);
    const node = { html: item.html, selector: item.selector, failureSummary: item.failureSummary };
    const merged = found.get(key);

    if (merged) {
      merged.nodes += item.nodes ?? 1;
      merged.details.push(node);
    } else {
      const { html, selector, failureSummary, ...rest } = item;

      found.set(key, { ...rest, nodes: item.nodes ?? 1, details: [node] });
    }
  }

  return found;
}

/**
 * The issue a rule and target belong to wherever they appear in the baseline: the issue most of
 * those entries name.
 *
 * @param {object[]} baseline The entries.
 * @returns {Map<string, string>} The issue id by `rule|target`.
 */
function signatureIndex(baseline) {
  const votes = new Map();

  for (const item of baseline) {
    const signature = `${item.rule}|${item.target}`;
    const counts = votes.get(signature) ?? new Map();

    counts.set(item.issue, (counts.get(item.issue) ?? 0) + 1);
    votes.set(signature, counts);
  }

  return new Map([...votes].map(([signature, counts]) => [signature,
    [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]]));
}

/**
 * Each catalog issue with what this run found of it.
 *
 * @param {object[]} issues The catalog.
 * @param {object} sets The verdict's sets.
 * @returns {object[]} The issues with `counts`.
 */
function issueCounts(issues, sets) {
  return issues.map((issue) => {
    const of = list => list.filter(item => (item.issue ?? item.suggestedIssue) === issue.id).length;

    return {
      ...issue,
      counts: {
        matched: of(sets.matched),
        grown: of(sets.grown),
        improved: of(sets.improved),
        stale: of(sets.stale),
        unverified: of(sets.unverified),
        newPages: of(sets.newViolations),
      },
    };
  });
}

/**
 * Counts items by a key.
 *
 * @param {object[]} items The items.
 * @param {Function} key The key of an item.
 * @returns {Map<string, number>} The counts.
 */
function countBy(items, key) {
  const counts = new Map();

  for (const item of items) {
    counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  }

  return counts;
}

/**
 * How many findings of each set a verdict holds.
 *
 * @param {object} verdict What `compareViolations()` returned.
 * @returns {{new: number, grown: number, matched: number, improved: number, stale: number, unverified: number, action: number}} The counts;
 * `action` is the total of the sets that fail a run in block mode.
 */
export function verdictCounts(verdict) {
  const counts = {
    new: verdict.newViolations.length,
    grown: verdict.grown.length,
    matched: verdict.matched.length,
    improved: verdict.improved.length,
    stale: verdict.stale.length,
    unverified: verdict.unverified.length,
  };

  return { ...counts, action: counts.new + counts.grown + counts.improved + counts.stale };
}

/**
 * The note for a scan engine that differs from the one the baseline was taken
 * with, or `null`. It compares the engine the scans actually ran
 * (`results.testEngine.version`), not the `axe-core` package the tests depend on:
 * `@axe-core/playwright` resolves its own copy, so a bump of it alone runs
 * different rules while the direct dependency stays put.
 *
 * @param {object} input The versions.
 * @param {string[]} input.engines The engine versions the scans report.
 * @param {string} input.baselineVersion The baseline's `axeCoreVersion`.
 * @returns {string|null} The note.
 */
export function engineVersionNote({ engines, baselineVersion }) {
  const ran = [...new Set(engines.filter(Boolean))].sort();
  const other = ran.filter(version => version !== baselineVersion);

  if (other.length === 0) {
    return null;
  }

  return `axe-core ${ran.join(', ')} ran the scans and the baseline was taken with ${baselineVersion}: `
    + 're-run the scan and refresh the baseline (and "axeCoreVersion") together with the version bump.';
}

/**
 * The one-line headline of a verdict, for the summary, the check run and the report.
 *
 * @param {object} verdict What `compareViolations()` returned.
 * @returns {string} The headline.
 */
export function headline(verdict) {
  const counts = verdictCounts(verdict);

  if (counts.action === 0) {
    return `No new accessibility findings: ${counts.matched} known, in ${verdict.issues.length} known issues`;
  }

  const parts = [
    [counts.new, 'new'], [counts.grown, 'grown'], [counts.improved, 'improved'], [counts.stale, 'stale'],
  ].filter(([count]) => count > 0).map(([count, label]) => `${count} ${label}`);

  return `${parts.join(', ')} (${verdict.mode} mode)`;
}

/**
 * The job-summary markdown for a verdict: the headline, one table per set that
 * needs action, the known issues, and the remedies. Every value goes through
 * `escapeMarkdownText()`, so GitHub displays it as written and none of it becomes
 * markup; a new finding's remedy still copies out as valid JSON from the rendered
 * summary.
 *
 * @param {object} verdict What `compareViolations()` returned.
 * @param {object} [context] Extra lines.
 * @param {string} [context.reportUrl] The HTML report's URL.
 * @returns {string} Markdown.
 */
export function renderSummary(verdict, { reportUrl } = {}) {
  const counts = verdictCounts(verdict);
  const titles = new Map(verdict.issues.map(issue => [issue.id, issue.title]));
  const issueCell = id => (id ? `${escapeMarkdownText(titles.get(id) ?? id)} (<code>${escapeMarkdownText(id)}</code>)` : '');
  const mark = counts.action === 0 ? '✅' : (verdict.mode === 'block' ? '❌' : '⚠️');
  const lines = [
    '## A11y / axe',
    '',
    `${mark} **${escapeMarkdownText(headline(verdict))}**`,
    '',
    `${verdict.mode} mode: ${counts.new} new, ${counts.grown} grown, ${counts.matched} matched, ${counts.improved} improved, `
      + `${counts.stale} stale, ${counts.unverified} unverified.`,
    '',
  ];

  if (reportUrl && SAFE_HELP_URL.test(reportUrl)) {
    lines.push(`📊 [Open the HTML report](${reportUrl})`, '');
  }
  if (counts.new > 0) {
    lines.push('### New findings', '', '| page | theme | rule | impact | target | nodes | known issue | help |', '|---|---|---|---|---|---|---|---|');
    for (const item of verdict.newViolations) {
      lines.push(`| ${row([item.page, item.theme, item.rule, item.impact ?? ''])} | <code>${escapeMarkdownText(item.target)}</code> `
        + `| ${item.nodes} | ${issueCell(item.suggestedIssue)} | ${helpCell(item)} |`);
    }
    lines.push('', ...verdict.newViolations.map(item => `- ${escapeMarkdownText(item.remedy)}`), '');
  }
  for (const [name, title] of [['grown', 'Grown findings'], ['improved', 'Improved findings']]) {
    if (verdict[name].length > 0) {
      lines.push(`### ${title}`, '', '| page | theme | rule | target | nodes | recorded | issue |', '|---|---|---|---|---|---|---|');
      for (const item of verdict[name]) {
        lines.push(`| ${row([item.page, item.theme, item.rule])} | <code>${escapeMarkdownText(item.target)}</code> `
          + `| ${item.nodes} | ${item.baselineNodes} | ${issueCell(item.issue)} |`);
      }
      lines.push('', ...verdict[name].map(item => `- ${escapeMarkdownText(item.remedy)}`), '');
    }
  }
  if (counts.stale > 0) {
    lines.push('### Stale baseline entries', '', '| page | theme | rule | target | issue |', '|---|---|---|---|---|');
    for (const item of verdict.stale) {
      lines.push(`| ${row([item.page, item.theme, item.rule])} | <code>${escapeMarkdownText(item.target)}</code> | ${issueCell(item.issue)} |`);
    }
    lines.push('', ...verdict.stale.map(item => `- ${escapeMarkdownText(item.remedy)}`), '');
  }
  if (verdict.issues.length > 0) {
    // The tracker stays in the baseline file: a report names a problem by what it is, so it reads the
    // same before a task is filed and after one is closed.
    lines.push('### Known issues', '', '| issue | findings |', '|---|---|');
    for (const issue of verdict.issues) {
      const found = issue.counts.matched + issue.counts.grown + issue.counts.improved;

      lines.push(`| ${issueCell(issue.id)} | ${found} |`);
    }
    lines.push('');
  }
  if (counts.unverified > 0) {
    lines.push('### Unverified baseline entries', '', ...verdict.unverified.map(item => `- ${escapeMarkdownText(entryKey(item))}: ${escapeMarkdownText(item.remedy)}`), '');
  }

  return lines.join('\n');
}

/**
 * The GitHub Actions workflow commands for a verdict: one annotation per finding
 * that needs action, `::warning` in warn mode and `::error` in block mode.
 *
 * @param {object} verdict What `compareViolations()` returned.
 * @returns {string[]} One command per line.
 */
export function renderAnnotations(verdict) {
  const level = verdict.mode === 'block' ? 'error' : 'warning';
  const command = (title, message) => `::${level} title=${escapeProperty(title)}::${escapeData(message)}`;
  const where = item => `${item.page} / ${item.theme}: ${item.rule} at ${item.target}`;

  return [
    ...verdict.newViolations.map(item => command('A11y axe: new finding',
      `${where(item)} — ${item.help ?? ''} (${item.nodes} node${item.nodes === 1 ? '' : 's'}; ${item.helpUrl ?? ''}). ${item.remedy}`)),
    ...verdict.grown.map(item => command('A11y axe: grown finding', `${where(item)} (issue "${item.issue}"): ${item.remedy}`)),
    ...verdict.improved.map(item => command('A11y axe: improved finding', `${where(item)} (issue "${item.issue}"): ${item.remedy}`)),
    ...verdict.stale.map(item => command('A11y axe: stale baseline entry', `${where(item)} (issue "${item.issue}"). ${item.remedy}`)),
  ];
}

/**
 * The remedy for a new finding: the entry to paste, under the known issue its rule and target
 * already belong to when there is one.
 *
 * @param {object} finding The finding.
 * @param {string|null} suggestedIssue The matching known issue.
 * @returns {string} One line.
 */
function newRemedy(finding, suggestedIssue) {
  const fields = {
    page: finding.page,
    theme: finding.theme,
    rule: finding.rule,
    target: finding.target,
    impact: finding.impact ?? null,
    nodes: finding.nodes ?? 1,
    issue: suggestedIssue ?? '',
  };
  const snippet = `{ ${Object.entries(fields).map(([name, value]) => `${JSON.stringify(name)}: ${JSON.stringify(value)}`).join(', ')} }`;

  return suggestedIssue
    ? `fix it, or, if it is the known issue "${suggestedIssue}" on another page or theme, add it to tests/${BASELINE_FILE}: ${snippet}`
    : `fix it, or add it to tests/${BASELINE_FILE} under an issue (a new one in "issues" needs a title; its tracker is optional): ${snippet}`;
}

/**
 * A short description of an entry for a problem line.
 *
 * @param {object} item The entry.
 * @returns {string} The description.
 */
function describe(item) {
  return KEY_FIELDS.map(field => `${field}=${JSON.stringify(item[field])}`).join(' ');
}

/**
 * A value made safe for a cell of a GitHub-flavored markdown table, displayed as written.
 *
 * Every character markdown or HTML reads is backslash-escaped, the backslash first among them in
 * the same pass, so an escape the value carries cannot pair with one added here: the pipe (which
 * ends a cell), the backslash, the backtick, emphasis and strikethrough marks, link brackets, the
 * angle brackets of an HTML tag, the ampersand of an entity and the dollar sign of GitHub's math.
 * A line break would end the table row, so it becomes a space. The values come from axe and from
 * the fixture DOM; the summary is rendered by GitHub, so none of them may turn into markup there.
 *
 * @param {unknown} value The value.
 * @returns {string} The cell text.
 */
export function escapeMarkdownText(value) {
  return String(value).replace(/\r?\n/g, ' ').replace(MARKDOWN_SPECIAL, '\\$&');
}

/**
 * Whether a URL may be linked from a report: plain https, nothing that ends a link or a cell.
 *
 * @param {unknown} url The URL.
 * @returns {boolean} Whether it is safe to link.
 */
export function isSafeLink(url) {
  return typeof url === 'string' && SAFE_HELP_URL.test(url);
}

/**
 * The help cell of a finding: the help text, linked only when the URL is a plain https URL that
 * cannot end the link or the cell early.
 *
 * @param {{rule: string, help?: string, helpUrl?: string}} item The finding.
 * @returns {string} The cell text.
 */
function helpCell(item) {
  const text = escapeMarkdownText(item.help ?? item.rule);

  return isSafeLink(item.helpUrl) ? `[${text}](${item.helpUrl})` : text;
}

/**
 * Escaped cells joined into the inside of a table row.
 *
 * @param {unknown[]} values The cell values.
 * @returns {string} The cells, joined with ` | `.
 */
function row(values) {
  return values.map(escapeMarkdownText).join(' | ');
}

/**
 * Percent-encodes the characters the workflow-command syntax reads in a message.
 *
 * @param {string} value The message.
 * @returns {string} The encoded message.
 */
function escapeData(value) {
  return String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

/**
 * Percent-encodes the characters the workflow-command syntax reads in a property.
 *
 * @param {string} value The property.
 * @returns {string} The encoded property.
 */
function escapeProperty(value) {
  return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}
