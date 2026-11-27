/**
 * The `A11y / axe report` check run: the pure half.
 *
 * The axe job's own check is green in warn mode whatever the scan found, so a finding would sit unseen in the
 * job summary. This check run is the visible verdict, by the severity rule every accessibility check run
 * follows (`lib/a11y-verdict.mjs`): red on a critical or serious finding, neutral with a warning on a
 * moderate or minor one, green on none, and red for a tooling failure, titled as one. What counts depends on
 * the run: a change run (a pull request, a push) counts what is new or grown against the baseline, and a
 * finding whose cluster in `tests/a11y/issues.json` has a tracker is a warning at most; an audit run (a
 * schedule, a dispatch) lists every open finding, the known ones too, and counts the ones the findings ledger does
 * not hold as open (a new finding, or a regression): known debt is a warning at most. An improved or stale entry is
 * advisory. Block mode, when it comes, fails the check on any finding that needs action. Its page carries the
 * job summary and the link to the HTML report, and its annotations sit on the line of the file to change: a
 * new or grown finding on the page's entry in `tests/a11y/pages.mjs`, a known, improved or fixed one on its
 * entry in the baseline. It never blocks a merge: only `CI Gate` is required.
 *
 * On a pull request the check run also judges what the pull request adds to the baseline
 * (`lib/a11y-baseline-guard.mjs`): an entry that is neither inherited (a page this pull request adds, showing a
 * finding the base baseline has on another page) nor an approved exception (its issue names a tracker, and the
 * `a11y-exception-approved` label a person added covers it) is the pull request's own finding, and the check run is
 * red, whatever its severity. Growth that could not be judged is a tooling failure.
 *
 * `tests/scripts/a11y-check-run.mjs` reads the reporter's `comparison.json`,
 * builds the payload here, and posts it. No I/O in here.
 */
import { BASELINE_FILE, entryKey, escapeMarkdownText, headline, renderSummary, verdictCounts } from './a11y-baseline.mjs';
import {
  AUDIT_LEDGER_COUNTING, AUDIT_WARNING_CLASSES, LEDGER_LABELS, annotationLevel, capAnnotations, ledgerCounts, ledgerLine, renderAuditLedger, renderVerdict,
  severityOfImpact, verdictOf, verdictTitle,
} from './a11y-verdict.mjs';
import { kindCounts } from './a11y-baseline-guard.mjs';
import { KIND_LABELS, neutralizeTaskIds } from './a11y-pr-comment.mjs';
import { pageIdOf } from './website-pages.mjs';

export const CHECK_RUN_NAME = 'A11y / axe report';
export const ANNOTATIONS_PER_REQUEST = 50;
// The Checks API refuses an output summary over 65,535 characters.
const SUMMARY_LIMIT = 65000;
const PAGES_FILE = 'tests/a11y/pages.mjs';
/**
 * The scans a check run reports, each with its check run's name, the job and comparison a tooling failure names, the
 * files its annotations go on, and the finding source and check its findings are clustered under in
 * `tests/a11y/issues.json`.
 */
export const PRODUCT_SCAN = Object.freeze({
  name: CHECK_RUN_NAME, title: 'A11y / axe', job: 'axe job', comparison: 'test-results/a11y/comparison.json', pagesFile: PAGES_FILE,
  baselineFile: `tests/${BASELINE_FILE}`, source: 'axe', check: 'axe',
});
export const DOCS_SCAN = Object.freeze({
  name: 'A11y / docs-axe report', title: 'A11y / docs axe', job: 'docs axe job', comparison: 'test-results/a11y-docs/comparison.json',
  pagesFile: 'tests/a11y/docs/pages.mjs', baselineFile: 'tests/a11y/docs/docs-baseline.json', source: 'docs', check: 'docs-axe',
});
export const WEBSITE_SCAN = Object.freeze({
  name: 'A11y / website-axe report', title: 'A11y / website axe', job: 'website axe job', comparison: 'test-results/a11y-website/comparison.json',
  pagesFile: 'tests/a11y/website/pages.mjs', baselineFile: 'tests/a11y/website/website-baseline.json', source: 'website', check: 'website-axe',
});

/**
 * The line of each page's entry in `tests/a11y/pages.mjs`, by page id.
 *
 * @param {string} source The file's text.
 * @returns {Map<string, number>} The 1-based lines.
 */
export function pageLines(source) {
  const lines = new Map();

  source.split('\n').forEach((line, index) => {
    const match = /\{\s*id:\s*'([a-z0-9-]+)'/.exec(line);

    if (match && !lines.has(match[1])) {
      lines.set(match[1], index + 1);
    }
  });

  return lines;
}

/**
 * The line of each docs page in `tests/a11y/docs/pages.mjs`, by page id. An entry of `EXTRA_PAGES` sits on its
 * own line, as a product page does; a guide page has no entry, because `guidePages()` builds it from the docs
 * visual list, so it sits on the line that declares that function.
 *
 * @param {string} source The file's text.
 * @param {string[]} ids Every page id (`DOCS_PAGES`).
 * @returns {Map<string, number>} The 1-based lines.
 */
export function docsPageLines(source, ids) {
  const lines = pageLines(source);
  const generator = source.split('\n').findIndex(line => /^export function guidePages\(/.test(line)) + 1;

  if (generator > 0) {
    for (const id of ids.filter(page => !lines.has(page))) {
      lines.set(id, generator);
    }
  }

  return lines;
}

/**
 * The line of each website page in `tests/a11y/website/pages.mjs`, by page id. An entry is a `page('<route>', …)` call
 * on one line, whose id is the one it names or the one its route gives (`pageIdOf()`, as the website's list derives it).
 *
 * @param {string} source The file's text.
 * @returns {Map<string, number>} The 1-based lines.
 */
export function websitePageLines(source) {
  const lines = new Map();

  source.split('\n').forEach((line, index) => {
    const match = /\bpage\('([^']+)'(?:,\s*\{\s*id:\s*'([a-z0-9-]+)')?/.exec(line);
    const id = match ? (match[2] ?? pageIdOf(match[1])) : null;

    if (id !== null && !lines.has(id)) {
      lines.set(id, index + 1);
    }
  });

  return lines;
}

/**
 * The line of each page in a page list, by page id, the way that list declares its pages: the product's by an `id:`
 * line (`pageLines()`), the docs' with the guide pages on the function that builds them (`docsPageLines()`), and the
 * website's by its `page()` calls, most of which take their id from the route (`websitePageLines()`). Every report that
 * annotates a page reads its lines here, so a scan's check run and its checks' check runs put one page on one line.
 *
 * @param {'product'|'docs'|'website'} list The page list.
 * @param {string} source The list's text.
 * @param {string[]} [ids] Every page id; the docs list needs them (`DOCS_PAGES`).
 * @returns {Map<string, number>} The 1-based lines.
 */
export function pageLinesOf(list, source, ids = []) {
  if (list === 'docs') {
    return docsPageLines(source, ids);
  }

  return list === 'website' ? websitePageLines(source) : pageLines(source);
}

/**
 * The line of each entry in the baseline, by its key. The file holds one entry per line.
 *
 * @param {string} source The file's text.
 * @returns {Map<string, number>} The 1-based lines.
 */
export function baselineLines(source) {
  const lines = new Map();

  source.split('\n').forEach((line, index) => {
    const text = line.trim().replace(/,$/, '');

    if (!text.startsWith('{"page"')) {
      return;
    }
    try {
      lines.set(entryKey(JSON.parse(text)), index + 1);
    } catch {
      // A line that is not one whole entry is not an entry's line.
    }
  });

  return lines;
}

/**
 * The check run's payload.
 *
 * @param {object} input What the run left.
 * @param {object|null} input.comparison The reporter's `comparison.json`, or `null` when it wrote none.
 * @param {Map<string, number>} input.pages The page lines (`pageLines()`).
 * @param {Map<string, number>} input.baseline The baseline lines (`baselineLines()`).
 * @param {string} [input.reportUrl] The HTML report's URL.
 * @param {string} [input.runUrl] The workflow run's URL.
 * @param {'audit'|'change'} [input.scope] What the run counts (`countingScope()` of `lib/a11y-verdict.mjs`).
 * @param {(source: string, check: string, item: object) => boolean} [input.tracked] Whether a finding's cluster
 * has a tracker (`trackedBy()` of `lib/a11y-issues.mjs`); read on a change run only.
 * @param {object} [input.scan] Which scan the comparison is: the product scan by default (`PRODUCT_SCAN`), or the
 * docs site scan (`DOCS_SCAN`) or the website scan (`WEBSITE_SCAN`), whose check run, page list, baseline and finding
 * source are their own.
 * @param {(item: object) => boolean} [input.drift] Whether a counted finding is baseline drift: on a change run it
 * counts as a warning at most, like a tracked one (`driftOf()` of `lib/a11y-docs-drift.mjs`; the site scans only).
 * @param {object} [input.auditLedger] On an audit, the findings ledger as the audit before left it (`auditLedgerOf()` of
 * `lib/a11y-pr-ledger.mjs`, built by the script, because this module is loaded by the verdict jobs, which check out
 * `tests/lib` alone): `{classify, auditAt, auditRun}`, and then a known finding or one on a target the audit before did
 * not measure is a warning at most, and a regression or a new one counts; or `{problem}` when the ledger did not load,
 * and then every open finding counts, with a note. Read on an audit only.
 * @param {object} [input.guard] What the pull request adds to the baseline, judged (`baselineGuard()` of
 * `lib/a11y-baseline-guard.mjs`); left out on a run without a pull request.
 * @returns {{name: string, conclusion: string, title: string, summary: string, annotations: object[]}} The payload.
 */
export function buildCheckRun({
  comparison, pages, baseline, reportUrl, runUrl, scope = 'change', tracked = () => false, scan = PRODUCT_SCAN, drift = () => false, auditLedger, guard,
}) {
  if (!comparison) {
    return {
      name: scan.name,
      conclusion: 'failure',
      title: '✖ Tooling failure: the scan wrote no comparison',
      summary: `**Verdict: red, a tooling failure.** The ${scan.job} ended without \`tests/${scan.comparison}\`, so nothing was compared. ${runLink(runUrl)}`,
      annotations: [],
    };
  }

  const counts = verdictCounts(comparison);
  const problems = [...(comparison.problems ?? []), ...(guard?.error ? [`the baseline growth was not judged: ${guard.error}`] : [])];
  const blocking = comparison.mode === 'block' && problems.length === 0 && counts.action > 0;
  // On an audit every open finding stays listed; the ledger decides only which count (`AUDIT_WARNING_CLASSES`).
  const audit = scope === 'audit' && auditLedger?.classify ? auditLedger : null;
  const findings = countedFindings(comparison, scope, tracked, scan, drift, audit);
  const verdict = verdictOf({ findings: findings.map(({ severity, warningOnly }) => ({ severity, warningOnly })), tooling: problems });
  const own = (guard?.judged ?? []).filter(item => item.kind === 'own');
  const ownRed = own.length > 0 && verdict.reason !== 'tooling';
  const conclusion = blocking || ownRed ? 'failure' : verdict.conclusion;
  const classified = audit ? findings.filter(item => item.ledger !== undefined) : null;
  const scanHeadline = classified ? `${ledgerLine(ledgerCounts(classified))} · ${headline(comparison)}` : headline(comparison);
  const scanTitle = blocking ? `✖ ${headline(comparison)}` : verdictTitle(verdict, scanHeadline);
  const title = ownRed ? `✖ Baseline growth: ${own.length} ${own.length === 1 ? 'entry is' : 'entries are'} this pull request's own · ${scanTitle}` : scanTitle;
  const ledgerProblem = scope === 'audit' ? auditLedger?.problem : undefined;
  const notes = [
    ...(comparison.notes ?? []),
    ...(ledgerProblem ? [`Known and new findings were not told apart, so every open finding counts: ${ledgerProblem}.`] : []),
    ...problems.map(problem => `Tooling problem: ${problem}`),
  ];
  const { annotations, omitted } = capAnnotations([...annotationsOf(findings, comparison, pages, baseline, scan), ...guardAnnotations(guard, baseline, scan)]);
  const lead = [
    ownRed ? GUARD_RED : '',
    blocking
      ? '**Verdict: red, block mode.** A finding that needs action fails this check and the job, whatever its severity.'
      : renderVerdict(verdict, {
        scope, counting: 'only a finding that is new or grown against the baseline counts', listTooling: false, ...(audit ? { auditCounting: AUDIT_LEDGER_COUNTING } : {}),
      }),
    comparison.mode === 'block'
      ? '**Block mode:** a finding that needs action fails this check and the job.'
      : '**Warn mode:** the job never fails on a finding; this check run\'s verdict says what the scan found, and it never blocks a merge.',
    runLink(runUrl),
    classified ? renderAuditLedger({
      auditLedger: audit,
      classified,
      columns: ['Severity', 'Page', 'Theme', 'Rule', 'Element'],
      cellsOf: ({ item, severity }) => [escapeMarkdownText(severity), escapeMarkdownText(item.page), escapeMarkdownText(item.theme), escapeMarkdownText(item.rule),
        `<code>${escapeMarkdownText(item.target)}</code>`],
    }) : '',
    omitted > 0 ? `The check run carries the ${annotations.length} worst annotations; ${omitted} more are in the job summary and the HTML report.` : '',
    ...notes.map(note => `> ${note}`),
    ...renderGuard(guard, comparison.issues ?? [], scan),
  ].filter(Boolean).join('\n\n');
  let summary = `${lead}\n\n${renderSummary(comparison, { reportUrl, title: scan.title })}`;

  if (summary.length > SUMMARY_LIMIT) {
    summary = `${summary.slice(0, SUMMARY_LIMIT)}\n\n… cut at ${SUMMARY_LIMIT} characters; the HTML report and the job summary hold the rest.`;
  }

  return { name: scan.name, conclusion, title: title.slice(0, 250), summary, annotations };
}

/**
 * The findings the verdict counts, each with its comparison item and set: on a change run the new and grown
 * ones, a tracked one a warning at most; on an audit run the known ones too, tracked or not, and with the findings
 * ledger each with its ledger class, known debt and a target not measured before a warning at most. An improved or a
 * stale entry is advisory: the scan found less than recorded, which needs a baseline edit and no fix.
 *
 * @param {object} comparison The comparison.
 * @param {'audit'|'change'} scope The scope.
 * @param {Function} tracked The tracker predicate.
 * @param {object} scan The scan.
 * @param {Function} drift The drift predicate.
 * @param {{classify: Function}|null} audit The audit's ledger input, or `null`.
 * @returns {Array<{set: string, item: object, severity: string, warningOnly: boolean, ledger?: string}>} The findings.
 */
function countedFindings(comparison, scope, tracked, scan, drift, audit) {
  const counted = set => comparison[set].map((item) => {
    const ledger = audit ? audit.classify(scan.check, item).ledger : undefined;

    return {
      set,
      item,
      ledger,
      severity: severityOfImpact(item.impact),
      warningOnly: (scope === 'change' && (Boolean(tracked(scan.source, scan.check, item)) || Boolean(drift(item)))) || AUDIT_WARNING_CLASSES.includes(ledger),
    };
  });
  const advisory = set => comparison[set].map(item => ({ set, item, severity: 'advisory', warningOnly: false }));

  return [
    ...counted('newViolations'),
    ...counted('grown'),
    ...(scope === 'audit' ? counted('matched') : []),
    ...advisory('improved'),
    ...advisory('stale'),
  ];
}

/**
 * One annotation per finding the verdict read, on the line of the file to change, in file and line order.
 * Block mode keeps every annotation a failure.
 *
 * @param {object[]} findings The findings (`countedFindings()`).
 * @param {object} comparison The comparison.
 * @param {Map<string, number>} pages The page lines.
 * @param {Map<string, number>} baseline The baseline lines.
 * @param {object} scan The scan.
 * @returns {object[]} The annotations.
 */
function annotationsOf(findings, comparison, pages, baseline, scan) {
  const where = item => `${item.page} on ${item.theme}: ${item.rule} on ${item.target}`;
  const titles = {
    newViolations: (item, severity) => `New accessibility finding (${severity}): ${item.rule}`,
    grown: (item, severity) => `Grown accessibility finding (${severity}): ${item.rule}`,
    matched: (item, severity) => `Known accessibility finding (${severity}): ${item.rule}`,
    improved: () => 'Improved: lower the recorded node count',
    stale: () => 'Fixed: delete the baseline entry',
  };

  return findings.map(({ set, item, severity, warningOnly, ledger }) => {
    const onPage = set === 'newViolations' || set === 'grown';
    const path = onPage ? scan.pagesFile : scan.baselineFile;
    const line = (onPage ? pages.get(item.page) : baseline.get(entryKey(item))) ?? 1;

    return {
      path,
      start_line: line,
      end_line: line,
      annotation_level: comparison.mode === 'block' ? 'failure' : annotationLevel({ severity, warningOnly }),
      title: `${titles[set](item, severity)}${ledger ? ` · ledger: ${LEDGER_LABELS[ledger].toLowerCase()}` : ''}`,
      message: `${where(item)}. ${item.remedy}`,
    };
  }).sort((a, b) => a.path.localeCompare(b.path) || a.start_line - b.start_line);
}

const GUARD_RED = '**Baseline growth: red.** This pull request adds an entry to the baseline that is neither inherited nor an '
  + 'approved exception, so the scan reads its own finding as known. Whatever its severity, that turns this check run red.';
// How many judged entries the summary spells out; the rest are counted.
const GUARD_ROWS = 30;

/**
 * The summary's section on what the pull request adds to the baseline: the rule, the label, and every entry with
 * its kind and why. Nothing without a pull request, or when the growth was not judged (a tooling problem says so).
 *
 * @param {object} [guard] The judged growth (`baselineGuard()`).
 * @param {object[]} issues The comparison's issues, for their titles.
 * @param {object} scan The scan.
 * @returns {string[]} Markdown paragraphs.
 */
function renderGuard(guard, issues, scan) {
  if (!guard || guard.error) {
    return [];
  }
  if (guard.judged.length === 0) {
    return [`**Baseline growth:** this pull request adds nothing to \`${scan.baselineFile}\`.`];
  }

  const titles = new Map(issues.map(issue => [issue.id, issue.title]));
  const counts = kindCounts(guard.judged);
  const text = value => escapeMarkdownText(neutralizeTaskIds(value));
  const rows = guard.judged.slice(0, GUARD_ROWS).map(item => `| ${KIND_LABELS[item.kind]} | ${text(item.page)} | ${text(item.theme)} | ${text(item.rule)} `
    + `| <code>${text(item.target)}</code> | ${item.change === 'raised' ? `${item.nodes} (was ${item.baseNodes})` : item.nodes} `
    + `| ${text(titles.get(item.issue) ?? item.issue)}${item.tracker ? ` (${text(item.tracker)})` : ''} | ${text(item.reason)} |`);

  return [
    `#### What this pull request adds to the baseline\n\n${counts.own} own, ${counts.exception} approved ${counts.exception === 1 ? 'exception' : 'exceptions'}, `
      + `${counts.inherited} inherited. An entry this pull request adds to \`${scan.baselineFile}\`, or a count it raises, is allowed when it is `
      + '**inherited** (a page this pull request adds shows a finding the base baseline has on another page: same issue, rule, element and theme) or an '
      + `**approved exception** (its issue names the task that owns the fix in \`tracker\`, and the \`${guard.label}\` label covers it). Anything `
      + 'else is this pull request\'s **own** finding: fix it here and delete the entry.',
    `An exception is approved by a person, never by an agent: the accessibility lead adds the \`${guard.label}\` label by hand, then re-runs the `
      + `\`A11y / axe\` job. The label covers the entries the baseline held, at those counts, at the head the pull request had when it went on. `
      + approvalLine(guard),
    ['| Kind | Page | Theme | Rule | Element | Elements | Known issue | Why |', '|---|---|---|---|---|--:|---|---|', ...rows].join('\n'),
    guard.judged.length > GUARD_ROWS ? `…and ${guard.judged.length - GUARD_ROWS} more in this pull request's diff of \`${scan.baselineFile}\`.` : '',
  ];
}

/**
 * The sentence on the label as the pull request carries it.
 *
 * @param {object} guard The judged growth.
 * @returns {string} Markdown.
 */
function approvalLine(guard) {
  const text = value => escapeMarkdownText(value);

  if (!guard.approval) {
    return `This pull request has no \`${guard.label}\` label.`;
  }
  if (guard.approval.problem) {
    return `The label is on, added by <code>${text(guard.approval.by)}</code> on ${text(guard.approval.at)}, and covers nothing: ${text(guard.approval.problem)}.`;
  }

  return `The label is on, added by <code>${text(guard.approval.by)}</code> on ${text(guard.approval.at)}.`;
}

/**
 * One annotation per own entry (a failure) and per approved exception (a notice), on the entry's line in the
 * baseline. An inherited entry needs nothing.
 *
 * @param {object} [guard] The judged growth.
 * @param {Map<string, number>} baseline The baseline lines.
 * @param {object} scan The scan.
 * @returns {object[]} The annotations.
 */
function guardAnnotations(guard, baseline, scan) {
  return (guard?.judged ?? []).filter(item => item.kind !== 'inherited').map((item) => {
    const line = baseline.get(entryKey(item)) ?? 1;

    return {
      path: scan.baselineFile,
      start_line: line,
      end_line: line,
      annotation_level: item.kind === 'own' ? 'failure' : 'notice',
      title: item.kind === 'own' ? 'Own finding added to the baseline: fix it, or have the exception approved' : 'Approved baseline exception',
      message: neutralizeTaskIds(`${item.page} on ${item.theme}: ${item.rule} on ${item.target}. ${item.reason}.`),
    };
  });
}

/**
 * A link to the workflow run, or nothing.
 *
 * @param {string} [runUrl] The URL.
 * @returns {string} Markdown.
 */
function runLink(runUrl) {
  return runUrl && /^https:\/\/[^\s()<>]+$/.test(runUrl) ? `[The workflow run](${runUrl})` : '';
}

/**
 * Splits annotations into the batches the Checks API takes per request.
 *
 * @param {object[]} items The annotations.
 * @param {number} [size] The batch size.
 * @returns {object[][]} The batches; always at least one, possibly empty.
 */
export function annotationBatches(items, size = ANNOTATIONS_PER_REQUEST) {
  const batches = [];

  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }

  return batches.length > 0 ? batches : [[]];
}
