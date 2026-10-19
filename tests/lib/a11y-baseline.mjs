/**
 * The axe baseline ratchet: the pure half.
 *
 * `tests/a11y/axe.spec.ts` runs axe-core over a curated set of fixture pages on
 * the three themes and attaches each scan's violations. The reporter
 * (`tests/reporters/a11y.ts`) flattens them into findings, compares them with
 * the committed baseline (`tests/a11y/axe-baseline.json`) through
 * `compareViolations()`, and renders the job summary and the annotations from
 * what comes back. No I/O in here. The policy is written up in `tests/AGENTS.md`
 * ("A11y: the axe scan and its baseline").
 *
 * A finding is keyed by page, theme, rule and a stable target
 * (`targetFingerprint()`): axe's own selector for the node, with the positional
 * indexes collapsed, so that which cell of a grid carries a finding is not part
 * of the key. The baseline is the list of findings that are known and owned: each
 * entry names the ClickUp task that owns the fix (`task`) and says what it is
 * (`note`). The comparison sorts a run into four sets:
 *
 * - new: a finding not in the baseline. The remedy is to fix it or to add an
 *   entry with an owner.
 * - matched: a baseline entry the run reproduced. Nothing to do.
 * - stale: a baseline entry whose page and theme were scanned and which did not
 *   reproduce. The remedy is to delete the entry, so the baseline only shrinks.
 * - unverified: a baseline entry whose page or theme was not scanned this run
 *   (the page failed to load, or it is no longer in the list). Nothing to do until
 *   it runs; the tooling test refuses an entry whose page is not in the list.
 *
 * `A11Y_MODE` is the one-line switch: `warn` keeps the job green whatever the
 * sets hold (the summary and the annotations still report them), `block` fails
 * the run on a new finding or a stale entry. The flip comes after a replay over
 * recent pull requests shows the comparator is precise.
 */

export const A11Y_MODES = ['warn', 'block'];
export const A11Y_MODE = 'warn';
export const A11Y_THEMES = ['main', 'horizon', 'classic'];
export const BASELINE_FILE = 'a11y/axe-baseline.json';

const TASK_ID = /^[A-Z][A-Z0-9]*-\d+$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const POSITIONAL_INDEX = /:nth-(child|of-type|last-child|last-of-type)\(\d+\)/g;
// An attribute selector with a value. `role` and `type` say what the node is and keep theirs;
// every other value (an aria-label, a test id, a name) is content, and dropping it is what keeps
// one structural finding from fanning out into one key per menu item or per cell.
const ATTRIBUTE_WITH_VALUE = /\[([^\]=~|^$*]+)[~|^$*]?="(?:[^"\\]|\\.)*"\]/g;
const DESCRIPTIVE_ATTRIBUTES = new Set(['role', 'type']);
// The id the core gives a root element that has none (`ht_<random>`, `core.ts`), Walkontable's
// instance guid (`wt_<random>`), and any id derived from them: different on every page load.
const GENERATED_ID = /#(ht|wt)_[0-9a-f]+[\w-]*/g;
const COMBINATOR = /\s*[>+~]\s*|\s+/;
const START_TAG = /^<([a-z][a-z0-9-]*)([^>]*)>/i;
const ROLE_ATTRIBUTE = /\brole="([^"]+)"/;
const CLASS_ATTRIBUTE = /\bclass="([^"]*)"/;
// Classes that say which instance or theme rendered the node, not what the node is.
const NON_DESCRIPTIVE_CLASS = /^(ht|wt)_|^ht-theme-|\.\.\.$/;
const KEY_FIELDS = ['page', 'theme', 'rule', 'target'];
// What markdown or HTML reads inside a table cell (`escapeMarkdownText()`).
const MARKDOWN_SPECIAL = /[\\`*_[\]<>&|~$]/g;
// A help URL the summary links: https, and none of the characters that end a link destination or a
// table cell. axe's own `helpUrl` always qualifies; anything else is shown as text.
const SAFE_HELP_URL = /^https:\/\/[^\s()<>|\\`"']+$/;

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
 * The stable form of an axe node target: the node's own compound selector, taken
 * from the selector axe chose for it (the ancestors axe added for uniqueness are
 * dropped), with every positional index (`:nth-child(3)`) collapsed to `n`, every
 * attribute value other than `role` and `type` dropped (`td[aria-label]`), and a
 * generated instance id (`#ht_2748fc73094c28f8`) replaced by what the node's own
 * start tag says it is: `div[role="treegrid"]`, or `div.wtHolder` without a role,
 * or `#ht_*` when no markup is given. A target that crosses a shadow root is an
 * array of selectors; the node is the last compound of the last one.
 *
 * @param {Array<string|string[]>} target The `target` of an axe result node.
 * @param {string} [html] The node's `html` from the same axe result node (its start tag, as axe
 * reports it).
 * @returns {string} The fingerprint.
 */
export function targetFingerprint(target, html = '') {
  const last = target.at(-1);
  const selector = Array.isArray(last) ? last.at(-1) : last;
  const compound = String(selector ?? '')
    .replace(ATTRIBUTE_WITH_VALUE, (whole, name) => (DESCRIPTIVE_ATTRIBUTES.has(name) ? whole : `[${name}]`))
    .trim()
    .split(COMBINATOR)
    .at(-1)
    .replace(POSITIONAL_INDEX, ':nth-$1(n)')
    .replace(GENERATED_ID, '#$1_*');
  const descriptor = describeNode(html);

  return descriptor && /^#(ht|wt)_\*$/.test(compound) ? descriptor : compound;
}

/**
 * What a node is, from its start tag: the tag with its role, or with its first
 * descriptive class, or alone. `null` when the text is not a start tag.
 *
 * @param {string} html The node's start tag.
 * @returns {string|null} The descriptor.
 */
function describeNode(html) {
  const match = START_TAG.exec(html);

  if (!match) {
    return null;
  }

  const tag = match[1].toLowerCase();
  const role = ROLE_ATTRIBUTE.exec(match[2])?.[1];

  if (role) {
    return `${tag}[role="${role}"]`;
  }

  const className = (CLASS_ATTRIBUTE.exec(match[2])?.[1] ?? '')
    .trim()
    .split(/\s+/)
    .find(name => name !== '' && !NON_DESCRIPTIVE_CLASS.test(name));

  return className ? `${tag}.${className}` : tag;
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
    return ['the baseline must be a JSON object with "axeCoreVersion" and "entries"'];
  }

  const problems = [];

  if (typeof document.axeCoreVersion !== 'string' || !SEMVER.test(document.axeCoreVersion)) {
    problems.push('"axeCoreVersion" must be the exact axe-core version the baseline was taken with (x.y.z)');
  }
  if (!Array.isArray(document.entries)) {
    problems.push('"entries" must be an array');

    return problems;
  }

  const seen = new Map();

  document.entries.forEach((item, index) => {
    const where = `entry ${index + 1}`;

    if (item === null || typeof item !== 'object') {
      problems.push(`${where} is not an object`);

      return;
    }
    for (const field of ['page', 'rule', 'target', 'note']) {
      if (typeof item[field] !== 'string' || item[field] === '') {
        problems.push(`${where} (${describe(item)}): "${field}" must be a non-empty string`);
      }
    }
    if (!A11Y_THEMES.includes(item.theme)) {
      problems.push(`${where} (${describe(item)}): theme ${JSON.stringify(item.theme)} is not one of ${A11Y_THEMES.join(', ')}`);
    }
    if (typeof item.page === 'string' && item.page !== '' && !pages.includes(item.page)) {
      problems.push(`${where} (${describe(item)}): page "${item.page}" is not in the scan list (tests/a11y/pages.mjs); `
        + 'delete the entry or restore the page');
    }
    if (typeof item.task !== 'string' || !TASK_ID.test(item.task)) {
      problems.push(`${where} (${describe(item)}): "task" must name the ClickUp task that owns the fix (DEV-1234), `
        + `got ${JSON.stringify(item.task)}`);
    }

    const key = entryKey(item);

    if (seen.has(key)) {
      problems.push(`${where} duplicates entry ${seen.get(key)} (${key})`);
    } else {
      seen.set(key, index + 1);
    }
  });

  return problems;
}

/**
 * Sorts a run's findings against the baseline and decides the run's status in
 * the given mode.
 *
 * @param {object} input The run.
 * @param {object[]} input.baseline The baseline entries (validated already).
 * @param {object[]} input.violations The run's findings: `page`, `theme`, `rule`, `target` (a fingerprint),
 * `impact`, `help`, `helpUrl`, `html`, `nodes`.
 * @param {Array<{page: string, theme: string}>} input.scanned The page × theme pairs the run completed.
 * @param {'warn'|'block'} input.mode The mode.
 * @returns {object} The verdict: `mode`, `status`, `newViolations`, `matched`, `stale`, `unverified`.
 */
export function compareViolations({ baseline, violations, scanned, mode }) {
  if (!A11Y_MODES.includes(mode)) {
    throw new Error(`Unknown a11y mode ${JSON.stringify(mode)}; expected one of ${A11Y_MODES.join(', ')}`);
  }

  const scannedKeys = new Set(scanned.map(({ page, theme }) => `${page}|${theme}`));
  const byKey = new Map(baseline.map(item => [entryKey(item), item]));
  const seen = new Map();

  for (const item of violations) {
    const key = entryKey(item);
    const merged = seen.get(key);

    if (merged) {
      merged.nodes += item.nodes ?? 1;
    } else {
      seen.set(key, { ...item, nodes: item.nodes ?? 1 });
    }
  }

  const newViolations = [];
  const matched = [];

  for (const [key, finding] of seen) {
    const owner = byKey.get(key);

    if (owner) {
      matched.push({ ...finding, task: owner.task, note: owner.note, remedy: `owned by ${owner.task}: ${owner.note}` });
    } else {
      newViolations.push({ ...finding, remedy: newRemedy(finding) });
    }
  }

  const stale = [];
  const unverified = [];

  for (const item of baseline) {
    if (seen.has(entryKey(item))) {
      continue;
    }
    if (scannedKeys.has(`${item.page}|${item.theme}`)) {
      stale.push({ ...item, remedy: `delete the entry (${entryKey(item)}) from tests/${BASELINE_FILE}: the finding no longer reproduces` });
    } else {
      unverified.push({ ...item, remedy: `${item.page} on ${item.theme} was not scanned this run; nothing to do until it runs` });
    }
  }

  const sortByKey = (a, b) => entryKey(a).localeCompare(entryKey(b));

  newViolations.sort(sortByKey);
  matched.sort(sortByKey);
  stale.sort(sortByKey);
  unverified.sort(sortByKey);

  const failing = mode === 'block' && (newViolations.length > 0 || stale.length > 0);

  return { mode, status: failing ? 'failed' : 'passed', newViolations, matched, stale, unverified };
}

/**
 * The job-summary markdown for a verdict: the headline counts, one table per
 * non-empty set, and the remedies. Every value goes through
 * `escapeMarkdownText()`, so GitHub displays it as written and none of it
 * becomes markup; a new finding's remedy still copies out as valid JSON from
 * the rendered summary.
 *
 * @param {object} verdict What `compareViolations()` returned.
 * @returns {string} Markdown.
 */
export function renderSummary(verdict) {
  const { mode, newViolations, matched, stale, unverified } = verdict;
  const lines = [
    '## A11y / axe',
    '',
    `${mode} mode: ${newViolations.length} new, ${matched.length} matched, ${stale.length} stale, `
      + `${unverified.length} unverified baseline ${unverified.length === 1 ? 'entry' : 'entries'}.`,
    '',
  ];

  if (newViolations.length > 0) {
    lines.push('### New violations', '', '| page | theme | rule | impact | target | nodes | help |', '|---|---|---|---|---|---|---|');
    for (const item of newViolations) {
      lines.push(`| ${row([item.page, item.theme, item.rule, item.impact ?? ''])} | <code>${escapeMarkdownText(item.target)}</code> `
        + `| ${item.nodes} | ${helpCell(item)} |`);
    }
    lines.push('', ...newViolations.map(item => `- ${escapeMarkdownText(item.remedy)}`), '');
  }
  if (stale.length > 0) {
    lines.push('### Stale baseline entries', '', '| page | theme | rule | task | target |', '|---|---|---|---|---|');
    for (const item of stale) {
      lines.push(`| ${row([item.page, item.theme, item.rule, item.task])} | <code>${escapeMarkdownText(item.target)}</code> |`);
    }
    lines.push('', ...stale.map(item => `- ${escapeMarkdownText(item.remedy)}`), '');
  }
  if (matched.length > 0) {
    const byTask = new Map();

    for (const item of matched) {
      byTask.set(item.task, (byTask.get(item.task) ?? 0) + 1);
    }
    lines.push('### Matched baseline entries', '', '| task | findings |', '|---|---|');
    for (const [task, count] of [...byTask].sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`| ${escapeMarkdownText(task)} | ${count} |`);
    }
    lines.push('');
  }
  if (unverified.length > 0) {
    lines.push('### Unverified baseline entries', '', ...unverified.map(item => `- ${escapeMarkdownText(entryKey(item))}: ${escapeMarkdownText(item.remedy)}`), '');
  }

  return lines.join('\n');
}

/**
 * The GitHub Actions workflow commands for a verdict: one annotation per new
 * finding and per stale entry, `::warning` in warn mode and `::error` in block
 * mode.
 *
 * @param {object} verdict What `compareViolations()` returned.
 * @returns {string[]} One command per line.
 */
export function renderAnnotations(verdict) {
  const level = verdict.mode === 'block' ? 'error' : 'warning';
  const command = (title, message) => `::${level} title=${escapeProperty(title)}::${escapeData(message)}`;

  return [
    ...verdict.newViolations.map(item => command('A11y axe: new violation',
      `${item.page} / ${item.theme}: ${item.rule} at ${item.target} — ${item.help ?? ''} (${item.nodes} node${item.nodes === 1 ? '' : 's'}; ${item.helpUrl ?? ''}). ${item.remedy}`)),
    ...verdict.stale.map(item => command('A11y axe: stale baseline entry',
      `${item.page} / ${item.theme}: ${item.rule} at ${item.target} (${item.task}). ${item.remedy}`)),
  ];
}

/**
 * The remedy for a new finding: the entry to paste, with the task left to fill in.
 *
 * @param {object} finding The finding.
 * @returns {string} One line.
 */
function newRemedy(finding) {
  const snippet = JSON.stringify({
    page: finding.page,
    theme: finding.theme,
    rule: finding.rule,
    target: finding.target,
    impact: finding.impact ?? null,
    task: 'DEV-',
    note: finding.help ?? '',
  }).replace(/","/g, '", "').replace(/":"/g, '": "').replace(/":null/g, '": null');

  return `fix it, or add it to tests/${BASELINE_FILE} with the task that owns the fix: ${snippet}`;
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
 * The help cell of a finding: the help text, linked only when the URL is a plain https URL that
 * cannot end the link or the cell early.
 *
 * @param {{rule: string, help?: string, helpUrl?: string}} item The finding.
 * @returns {string} The cell text.
 */
function helpCell(item) {
  const text = escapeMarkdownText(item.help ?? item.rule);

  return SAFE_HELP_URL.test(item.helpUrl ?? '') ? `[${text}](${item.helpUrl})` : text;
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
