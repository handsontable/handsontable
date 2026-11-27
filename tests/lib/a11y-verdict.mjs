/**
 * The verdict of an accessibility check run: one rule for the axe scan (`A11y / axe report`), the checks beyond
 * axe (`A11y / <check> report`) and the screen reader lanes (`Screen reader / <project> report`).
 *
 * - **Red** (`failure`) when a counted finding is critical or serious.
 * - **Warning** (`neutral`, with a warning annotation per finding) when the worst counted finding is moderate or
 *   minor, or a finding counts as a warning only.
 * - **Green** (`success`) when nothing counts. An advisory row (a golden that moved, a result axe could not
 *   decide) never raises the verdict.
 * - **A tooling failure** (a check that measured nothing or not everything, a reader that did not start, a lost
 *   step) is red for a reason of its own, and the title says so.
 *
 * What counts depends on the run (`countingScope()`): an audit (a schedule or a dispatch) lists every open
 * finding and counts the ones the findings ledger, as the audit before left it, does not hold as open (a new
 * finding, or a regression); known debt, and a finding on a target the audit before did not measure, is a warning
 * at most there (`AUDIT_WARNING_CLASSES`). A change (a pull request or a push) counts what the change can act on,
 * and a finding whose cluster in `tests/a11y/issues.json` has a tracker is a warning at most there. The callers
 * classify the findings (`lib/a11y-pr-ledger.mjs` reads the ledger; this module reads nothing) and pass which are
 * warning-only here. A check run reports; it never fails the job or stops the run, and only
 * `CI Gate` is required, so a red check run blocks no merge by itself. The run-level verdict
 * (`runVerdict()`) reads the check runs a workflow run posted and follows the worst.
 *
 * The policy is `tests/AGENTS.md`, "A11y: the verdict of a check run". No I/O in here.
 */
import { escapeMarkdownText as escape, isSafeLink } from './a11y-baseline.mjs';

export const VERDICT_SEVERITIES = ['critical', 'serious', 'moderate', 'minor', 'advisory'];
export const RED_SEVERITIES = ['critical', 'serious'];
export const WARNING_SEVERITIES = ['moderate', 'minor'];
/**
 * The events that make a run an audit. Everything else (a pull request, a push, a local run) is a change.
 */
export const AUDIT_EVENTS = ['schedule', 'workflow_dispatch'];
/**
 * How many annotations a check run carries; the summary says how many it left out.
 */
export const ANNOTATION_CAP = 100;
export const VERDICT_RULE = '(critical/serious = red, moderate/minor = warning)';
/**
 * The conclusions a poster writes. A check run that ended any other way (`cancelled`, `timed_out`) is not read
 * as a pass by the run verdict.
 */
export const POSTED_CONCLUSIONS = ['success', 'neutral', 'failure'];
/**
 * How a finding reads against the findings ledger (`test-health/a11y.json` on `gh-pages`), in the order a report lists
 * them: a **regression** has a resolved row (a fix came undone), a **new** finding has no row, one **not measured
 * before** has no row on a target the latest audit did not measure (a page, check, variant or scenario added since),
 * and a **known** one has an open row (new, persisting or flapping). A pull request uses three of them
 * (`lib/a11y-pr-ledger.mjs`, `ledgerClass()`); an audit all four (`auditClass()`).
 */
export const LEDGER_CLASSES = ['regression', 'new', 'unmeasured', 'known'];
export const LEDGER_LABELS = Object.freeze({ regression: 'Regression', new: 'New', unmeasured: 'Not measured before', known: 'Known' });
/**
 * The ledger classes that are a warning at most on an audit: known debt never turns the weekly audit red, and nor
 * does a finding on a target the audit before did not measure, because nothing was seen to work there. A regression
 * and a new finding count at their severity.
 */
export const AUDIT_WARNING_CLASSES = Object.freeze(['known', 'unmeasured']);
/**
 * What an audit counts when the findings ledger was read, as `renderVerdict()` says it.
 */
export const AUDIT_LEDGER_COUNTING = 'every finding is listed, and one the findings ledger does not hold as open counts (a new one, or a regression), '
  + 'tracked or not; known debt, and a finding on a target the audit before did not measure, is a warning at most';
// How many regressions, new findings and findings not measured before an audit's ledger section spells out.
const AUDIT_LEDGER_ROWS = 30;

const COUNTED = [...RED_SEVERITIES, ...WARNING_SEVERITIES];
const LEVEL_ORDER = ['failure', 'warning', 'notice'];
const TITLE_LIMIT = 250;
const TOOLING_LINES = 20;
const RULE_SENTENCE = 'Red on a critical or serious finding, neutral with a warning on a moderate or minor one, green on none; advisory rows never raise it.';
const LABEL = {
  red: { icon: '✖', word: 'Red', lead: 'red' },
  warning: { icon: '⚠', word: 'Warning', lead: 'a warning' },
  clean: { icon: '✔', word: 'Green', lead: 'green' },
};
const ROW_LABEL = { success: '✔ green', neutral: '⚠ warning', failure: '✖ red' };

/**
 * The severity of an axe impact. A violation axe gave no impact (`null`) counts as serious: it failed a WCAG
 * 2.2 A or AA rule, and an unknown impact is never read as a minor one.
 *
 * @param {string|null|undefined} impact The impact.
 * @returns {string} The severity.
 */
export function severityOfImpact(impact) {
  return COUNTED.includes(impact) ? impact : 'serious';
}

/**
 * Whether a run is an audit or a change, from the event that started it (`GITHUB_EVENT_NAME`; in a reusable
 * workflow, the caller's).
 *
 * @param {string|undefined} eventName The event.
 * @returns {'audit'|'change'} The scope.
 */
export function countingScope(eventName) {
  return AUDIT_EVENTS.includes(eventName) ? 'audit' : 'change';
}

/**
 * The verdict of a run.
 *
 * @param {object} input The input.
 * @param {Array<{severity: string, warningOnly?: boolean}>} [input.findings] Every finding the run reported.
 * `warningOnly` marks one that is a warning at most (tracked debt on a change run, a record below the target level).
 * @param {string[]} [input.tooling] Why the run did not measure what it should; any problem makes it red.
 * @returns {{conclusion: 'success'|'neutral'|'failure', reason: 'tooling'|'red'|'warning'|'clean', counted: object, warningOnly: object, advisory: number, tooling: string[]}} The verdict.
 */
export function verdictOf({ findings = [], tooling = [] }) {
  const zero = () => Object.fromEntries(COUNTED.map(severity => [severity, 0]));
  const counted = zero();
  const warningOnly = zero();
  let advisory = 0;

  for (const finding of findings) {
    if (!VERDICT_SEVERITIES.includes(finding.severity)) {
      throw new Error(`unknown severity "${String(finding.severity)}"; expected one of ${VERDICT_SEVERITIES.join(', ')}`);
    }
    if (finding.severity === 'advisory') {
      advisory += 1;
    } else if (finding.warningOnly) {
      warningOnly[finding.severity] += 1;
    } else {
      counted[finding.severity] += 1;
    }
  }

  const any = (counts, severities) => severities.some(severity => counts[severity] > 0);
  let reason = 'clean';

  if (tooling.length > 0) {
    reason = 'tooling';
  } else if (any(counted, RED_SEVERITIES)) {
    reason = 'red';
  } else if (any(counted, WARNING_SEVERITIES) || any(warningOnly, COUNTED)) {
    reason = 'warning';
  }

  const conclusion = { tooling: 'failure', red: 'failure', warning: 'neutral', clean: 'success' }[reason];

  return { conclusion, reason, counted, warningOnly, advisory, tooling: [...tooling] };
}

/**
 * The check run's title: the verdict, the counted findings per severity and the rule, what else the run listed,
 * then the check's own headline. A tooling failure is titled as one, with its first problem.
 *
 * @param {object} verdict What `verdictOf()` returned.
 * @param {string} headline The check's own one-line summary.
 * @returns {string} The title, at most 250 characters (the Checks API takes 255).
 */
export function verdictTitle(verdict, headline) {
  if (verdict.reason === 'tooling') {
    return cut(`✖ Tooling failure: ${String(verdict.tooling[0]).replace(/\s+/g, ' ').trim()}`);
  }

  const label = LABEL[verdict.reason];
  const counts = COUNTED.map(severity => `${verdict.counted[severity]} ${severity}`).join(', ');
  const warningOnly = COUNTED.reduce((sum, severity) => sum + verdict.warningOnly[severity], 0);
  const extra = [
    warningOnly > 0 ? `${warningOnly} warning only` : '',
    verdict.advisory > 0 ? `${verdict.advisory} advisory` : '',
  ].filter(Boolean).join(', ');

  return cut(`${label.icon} ${label.word}: ${counts} ${VERDICT_RULE}${extra ? ` · ${extra}` : ''}${headline ? ` · ${headline}` : ''}`);
}

/**
 * The verdict block a check run's summary opens with: the verdict and its rule, what the run counted, and the
 * findings per severity.
 *
 * @param {object} verdict What `verdictOf()` returned.
 * @param {object} [options] The options.
 * @param {'audit'|'change'} [options.scope] What the run counted (`countingScope()`).
 * @param {string} [options.counting] What a change run of this check counts, as a clause.
 * @param {string} [options.auditCounting] What an audit run of this check counts, as a clause: every open finding
 * without the findings ledger, `AUDIT_LEDGER_COUNTING` with it.
 * @param {boolean} [options.listTooling] Whether to list the tooling problems; a caller that lists them itself
 * passes `false`.
 * @returns {string} Markdown.
 */
export function renderVerdict(verdict, {
  scope = 'change', counting = 'every finding counts', auditCounting = 'every open finding counts, tracked or not', listTooling = true,
} = {}) {
  const lines = [];

  if (verdict.reason === 'tooling') {
    lines.push('**Verdict: red, a tooling failure.** The run did not measure what it should, so the check is red for that reason, '
      + 'apart from any finding: a fault of the check or its runner, not a finding on the product.', '');
    if (listTooling) {
      lines.push(...verdict.tooling.slice(0, TOOLING_LINES).map(problem => `- ${escape(problem)}`));
      if (verdict.tooling.length > TOOLING_LINES) {
        lines.push(`- … and ${verdict.tooling.length - TOOLING_LINES} more.`);
      }
      lines.push('');
    }
  } else {
    lines.push(`**Verdict: ${LABEL[verdict.reason].lead}.** ${RULE_SENTENCE}`, '');
  }

  lines.push(scope === 'audit'
    ? `**Audit run** (a schedule or a dispatch): ${auditCounting}.`
    : `**Change run** (a pull request or a push): ${counting}; a finding whose cluster in \`tests/a11y/issues.json\` has a tracker is a warning at most.`, '');

  const listed = COUNTED.some(severity => verdict.counted[severity] + verdict.warningOnly[severity] > 0);

  if (listed) {
    lines.push('| Severity | Counted | Warning only |', '| --- | --: | --: |',
      ...COUNTED.map(severity => `| ${severity} | ${verdict.counted[severity]} | ${verdict.warningOnly[severity]} |`), '');
    if (COUNTED.some(severity => verdict.warningOnly[severity] > 0)) {
      lines.push(scope === 'audit'
        ? 'A warning-only finding is a warning whatever its severity: known debt, or a finding on a target the audit before did not measure, on an audit, '
          + 'or a finding that names no WCAG 2.2 A or AA criterion.'
        : 'A warning-only finding is a warning whatever its severity: tracked debt on a change run, or a finding that names no WCAG 2.2 A or AA criterion.', '');
    }
  }
  if (verdict.advisory > 0) {
    lines.push(`${verdict.advisory} advisory ${verdict.advisory === 1 ? 'row' : 'rows'}, never counted.`, '');
  }

  return lines.join('\n').trimEnd();
}

/**
 * How many findings of each ledger class.
 *
 * @param {Array<{ledger?: string}>} classified The findings, each with its class (`LEDGER_CLASSES`).
 * @returns {{regression: number, new: number, unmeasured: number, known: number}} The counts.
 */
export function ledgerCounts(classified) {
  return Object.fromEntries(LEDGER_CLASSES.map(name => [name, classified.filter(item => item.ledger === name).length]));
}

/**
 * The counts of the findings by ledger class, as a check run's title and the job summary say them. A pull request
 * never reads a finding as not measured before, so its line names three classes.
 *
 * @param {{regression: number, new: number, unmeasured?: number, known: number}} counts The counts (`ledgerCounts()`).
 * @returns {string} The line.
 */
export function ledgerLine(counts) {
  const unmeasured = counts.unmeasured > 0 ? `, ${counts.unmeasured} not measured before` : '';

  return `ledger: ${counts.new} new, ${counts.regression} ${counts.regression === 1 ? 'regression' : 'regressions'}${unmeasured}, ${counts.known} known`;
}

// The ledger line in a check run's title (`ledgerLine()`): an audit's check run that read the findings ledger carries
// it, and one that could not (or a tooling failure) does not, which is all the run verdict sees of the ledger.
const LEDGER_LINE = /\bledger: \d+ new, \d+ regressions?\b/;

/**
 * The section of an audit's check run that says how its findings read against the findings ledger as the audit before
 * left it: the rule, the counts, the two limits of the ledger as a baseline, and the findings that are not known debt
 * (regressions, then new findings, then the ones not measured before), at most `AUDIT_LEDGER_ROWS`.
 *
 * @param {object} input The input.
 * @param {{auditAt?: string|null, auditRun?: string|null}} input.auditLedger The audit's ledger input (`auditLedgerOf()` of
 * `lib/a11y-pr-ledger.mjs`): when and by which run the ledger was last written for this source.
 * @param {Array<{ledger: string}>} input.classified Every finding that can count (advisory rows left out), with its class.
 * @param {string[]} input.columns The headers of the columns after the class (`Severity`, `Page`, …).
 * @param {(item: object) => string[]} input.cellsOf A listed finding's cells, escaped for the table.
 * @returns {string} Markdown.
 */
export function renderAuditLedger({ auditLedger, classified, columns, cellsOf }) {
  const counts = ledgerCounts(classified);
  const date = auditLedger.auditAt ? escape(String(auditLedger.auditAt).slice(0, 10)) : null;
  const run = /^\d+$/.test(String(auditLedger.auditRun ?? '')) ? ` (run ${auditLedger.auditRun})` : '';
  const audit = date ? `the audit of ${date}${run}` : 'the latest audit';
  const listed = ['regression', 'new', 'unmeasured'].flatMap(name => classified.filter(item => item.ledger === name));
  const lines = [
    '#### New and known, by the findings ledger',
    '',
    `On an audit the findings ledger (\`test-health/a11y.json\` on \`gh-pages\`, as ${audit} left it) is the verdict's baseline. `
      + 'A finding whose ledger row is open is **known** debt: listed, and a warning at most. A **regression** has a resolved row: a fix came '
      + 'undone. A **new** finding has no row. Both count by the severity rule. A finding with no row on a target that audit did not measure '
      + '(a page, a check, a variant or a scenario added since) is **not measured before**: a warning at most, because nothing was seen to work '
      + 'there. Advisory rows never count and are left out.',
    '',
    '| New | Regressions | Not measured before | Known |',
    '| --: | --: | --: | --: |',
    `| ${counts.new} | ${counts.regression} | ${counts.unmeasured} | ${counts.known} |`,
    '',
    'Two limits. A row is keyed by the element\'s selector or the step, so a class or step renamed since that audit makes a known finding '
      + 'read as new. And an axe scan\'s coverage is one flag per night, not a list of pages, so a page added to a scan since reads as new, '
      + 'not as not measured before.',
  ];

  if (listed.length > 0) {
    lines.push('', `| | ${columns.join(' | ')} |`, `| --- |${columns.map(() => ' --- |').join('')}`);
    for (const item of listed.slice(0, AUDIT_LEDGER_ROWS)) {
      lines.push(`| ${LEDGER_LABELS[item.ledger]} | ${cellsOf(item).join(' | ')} |`);
    }
    if (listed.length > AUDIT_LEDGER_ROWS) {
      lines.push('', `…and ${listed.length - AUDIT_LEDGER_ROWS} more in the annotations and the run's artifacts.`);
    }
  }

  return lines.join('\n');
}

/**
 * The annotation level of a finding: a red one fails, a warning or a warning-only one warns, an advisory row
 * notifies.
 *
 * @param {{severity: string, warningOnly?: boolean}} finding The finding.
 * @returns {'failure'|'warning'|'notice'} The level.
 */
export function annotationLevel(finding) {
  if (finding.severity === 'advisory') {
    return 'notice';
  }
  if (finding.warningOnly) {
    return 'warning';
  }

  return RED_SEVERITIES.includes(finding.severity) ? 'failure' : 'warning';
}

/**
 * The annotations a check run carries: the worst first, at most `cap`, in their order within a level.
 *
 * @param {object[]} annotations The annotations, each with its `annotation_level`.
 * @param {number} [cap] The cap.
 * @returns {{annotations: object[], omitted: number}} The annotations kept and how many were left out.
 */
export function capAnnotations(annotations, cap = ANNOTATION_CAP) {
  const rank = item => LEVEL_ORDER.indexOf(item.annotation_level);
  const sorted = annotations.map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
    .map(({ item }) => item);

  return { annotations: sorted.slice(0, cap), omitted: Math.max(0, sorted.length - cap) };
}

/**
 * The verdict of a workflow run: the worst of the check runs it posted. A check run is the run's own when its
 * `external_id` is the run's id (the posters stamp it); a re-run's check run replaces the earlier one of its
 * name. A check run the run should have posted and did not, a run that posted none, and a conclusion the
 * posters never write are red.
 *
 * @param {object} input The input.
 * @param {object[]} input.checkRuns Every check run of the commit, as the Checks API lists them.
 * @param {string|number} input.runId The workflow run's id.
 * @param {string[]} input.prefixes The names to read (`A11y / `, `Screen reader / `).
 * @param {string[]} [input.expected] The names the run must have posted.
 * @returns {{conclusion: string, rows: Array<{name: string, conclusion: string, title: string, url: string}>, missing: string[], problems: string[]}} The verdict.
 */
export function runVerdict({ checkRuns, runId, prefixes, expected = [] }) {
  const latest = new Map();

  for (const run of checkRuns) {
    if (String(run.external_id ?? '') !== String(runId) || !prefixes.some(prefix => String(run.name).startsWith(prefix))) {
      continue;
    }

    const earlier = latest.get(run.name);

    if (!earlier || run.id > earlier.id) {
      latest.set(run.name, run);
    }
  }

  const rows = [...latest.values()].sort((a, b) => a.name.localeCompare(b.name))
    .map(run => ({ name: run.name, conclusion: run.conclusion ?? run.status, title: run.output?.title ?? '', url: run.html_url }));
  const missing = expected.filter(name => !latest.has(name));
  const problems = [
    ...(rows.length === 0 ? [`the run posted no check run under ${prefixes.map(prefix => `"${prefix}"`).join(' or ')}`] : []),
    ...missing.map(name => `the run posted no "${name}" check run`),
    ...rows.filter(row => !POSTED_CONCLUSIONS.includes(row.conclusion)).map(row => `"${row.name}" ended ${row.conclusion}, which no poster writes`),
  ];
  let conclusion = 'success';

  if (problems.length > 0 || rows.some(row => row.conclusion === 'failure')) {
    conclusion = 'failure';
  } else if (rows.some(row => row.conclusion === 'neutral')) {
    conclusion = 'neutral';
  }

  return { conclusion, rows, missing, problems };
}

/**
 * What an audit's check runs counted, said from their titles: one that read the findings ledger carries its counts
 * (`ledgerLine()`) and treats known debt as a warning at most; one that carries none counted every open finding, or is a
 * tooling failure, so the summary never says the debt was a warning when a check run could not tell it apart.
 *
 * @param {Array<{title: string}>} rows The check runs.
 * @returns {string} The sentences, each with a leading space.
 */
function auditSentence(rows) {
  const unread = rows.filter(row => !LEDGER_LINE.test(String(row.title ?? ''))).length;
  const read = ' On an audit a check run that read the findings ledger (its title carries the ledger counts) counts what the ledger does '
    + 'not hold as open (a new finding, or a regression) and a tooling failure: known debt is a warning at most, so it turns red on what '
    + 'changed since the audit before, not on the debt that stands.';

  if (unread === 0) {
    return read;
  }

  let which = `${unread} of the ${rows.length} check runs ${unread === 1 ? 'carries' : 'carry'} no ledger counts`;

  if (unread === rows.length) {
    which = rows.length === 1 ? 'The check run carries no ledger counts' : `None of the ${rows.length} check runs carries ledger counts`;
  }

  return `${read} ${which}: such a check run could not read the ledger and counted every open finding, debt included, or is a `
    + 'tooling failure, and its summary says which.';
}

/**
 * The run verdict as a job summary: a table of the check runs, red first in the reader's eye by its icon.
 *
 * @param {object} result What `runVerdict()` returned.
 * @param {object} [options] The options.
 * @param {'audit'|'change'} [options.scope] What the run's check runs counted (`countingScope()`).
 * @returns {string} Markdown.
 */
export function renderRunVerdict(result, { scope = 'change' } = {}) {
  const word = { success: 'green', neutral: 'a warning', failure: 'red' }[result.conclusion];
  const lines = [
    `## Run verdict: ${word}`,
    '',
    'The run follows its worst check run: red when any is red, a warning when the worst is one, green otherwise. '
      + `Each check run follows the severity rule ${VERDICT_RULE}; every scan and lane ran to the end before this was decided.`
      + (scope === 'audit' ? auditSentence(result.rows) : ''),
    '',
  ];

  if (result.problems.length > 0) {
    lines.push(...result.problems.map(problem => `- ✖ ${escape(problem)}`), '');
  }
  if (result.rows.length > 0) {
    lines.push('| Verdict | Check run | Title |', '| --- | --- | --- |');
    for (const row of result.rows) {
      const name = isSafeLink(row.url) ? `[${escape(row.name)}](${row.url})` : escape(row.name);

      lines.push(`| ${ROW_LABEL[row.conclusion] ?? `✖ ${escape(row.conclusion)}`} | ${name} | ${escape(row.title)} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * A title cut to the Checks API's limit.
 *
 * @param {string} text The title.
 * @returns {string} At most `TITLE_LIMIT` characters.
 */
function cut(text) {
  return text.length > TITLE_LIMIT ? `${text.slice(0, TITLE_LIMIT - 1)}…` : text;
}
