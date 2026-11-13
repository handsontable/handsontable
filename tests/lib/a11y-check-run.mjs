/**
 * The `A11y / axe report` check run: the pure half.
 *
 * The axe job's own check is green in warn mode whatever the scan found, so a finding would sit unseen in the
 * job summary. This check run is the visible verdict, by the severity rule every accessibility check run
 * follows (`lib/a11y-verdict.mjs`): red on a critical or serious finding, neutral with a warning on a
 * moderate or minor one, green on none, and red for a tooling failure, titled as one. What counts depends on
 * the run: a change run (a pull request, a push) counts what is new or grown against the baseline, and a
 * finding whose cluster in `tests/a11y/issues.json` has a tracker is a warning at most; an audit run (a
 * schedule, a dispatch) counts every open finding, the known ones too. An improved or stale entry is
 * advisory. Block mode, when it comes, fails the check on any finding that needs action. Its page carries the
 * job summary and the link to the HTML report, and its annotations sit on the line of the file to change: a
 * new or grown finding on the page's entry in `tests/a11y/pages.mjs`, a known, improved or fixed one on its
 * entry in the baseline. It never blocks a merge: only `CI Gate` is required.
 *
 * `tests/scripts/a11y-check-run.mjs` reads the reporter's `comparison.json`,
 * builds the payload here, and posts it. No I/O in here.
 */
import { BASELINE_FILE, entryKey, headline, renderSummary, verdictCounts } from './a11y-baseline.mjs';
import { annotationLevel, capAnnotations, renderVerdict, severityOfImpact, verdictOf, verdictTitle } from './a11y-verdict.mjs';

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
 * docs site scan (`DOCS_SCAN`), whose check run, page list, baseline and finding source are its own.
 * @param {(item: object) => boolean} [input.drift] Whether a counted finding is baseline drift: on a change run it
 * counts as a warning at most, like a tracked one (`driftOf()` of `lib/a11y-docs-drift.mjs`, new findings only; the
 * docs scan only).
 * @returns {{name: string, conclusion: string, title: string, summary: string, annotations: object[]}} The payload.
 */
export function buildCheckRun({
  comparison, pages, baseline, reportUrl, runUrl, scope = 'change', tracked = () => false, scan = PRODUCT_SCAN, drift = () => false,
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
  const problems = comparison.problems ?? [];
  const blocking = comparison.mode === 'block' && problems.length === 0 && counts.action > 0;
  const findings = countedFindings(comparison, scope, tracked, scan, drift);
  const verdict = verdictOf({ findings: findings.map(({ severity, warningOnly }) => ({ severity, warningOnly })), tooling: problems });
  const conclusion = blocking ? 'failure' : verdict.conclusion;
  const title = blocking ? `✖ ${headline(comparison)}` : verdictTitle(verdict, headline(comparison));
  const notes = [...(comparison.notes ?? []), ...problems.map(problem => `Tooling problem: ${problem}`)];
  const { annotations, omitted } = capAnnotations(annotationsOf(findings, comparison, pages, baseline, scan));
  const lead = [
    blocking
      ? '**Verdict: red, block mode.** A finding that needs action fails this check and the job, whatever its severity.'
      : renderVerdict(verdict, { scope, counting: 'only a finding that is new or grown against the baseline counts', listTooling: false }),
    comparison.mode === 'block'
      ? '**Block mode:** a finding that needs action fails this check and the job.'
      : '**Warn mode:** the job never fails on a finding; this check run\'s verdict says what the scan found, and it never blocks a merge.',
    runLink(runUrl),
    omitted > 0 ? `The check run carries the ${annotations.length} worst annotations; ${omitted} more are in the job summary and the HTML report.` : '',
    ...notes.map(note => `> ${note}`),
  ].filter(Boolean).join('\n\n');
  let summary = `${lead}\n\n${renderSummary(comparison, { reportUrl, title: scan.title })}`;

  if (summary.length > SUMMARY_LIMIT) {
    summary = `${summary.slice(0, SUMMARY_LIMIT)}\n\n… cut at ${SUMMARY_LIMIT} characters; the HTML report and the job summary hold the rest.`;
  }

  return { name: scan.name, conclusion, title: title.slice(0, 250), summary, annotations };
}

/**
 * The findings the verdict counts, each with its comparison item and set: on a change run the new and grown
 * ones, a tracked one a warning at most; on an audit run the known ones too, tracked or not. An improved or a
 * stale entry is advisory: the scan found less than recorded, which needs a baseline edit and no fix.
 *
 * @param {object} comparison The comparison.
 * @param {'audit'|'change'} scope The scope.
 * @param {Function} tracked The tracker predicate.
 * @param {object} scan The scan.
 * @param {Function} drift The drift predicate.
 * @returns {Array<{set: string, item: object, severity: string, warningOnly: boolean}>} The findings.
 */
function countedFindings(comparison, scope, tracked, scan, drift) {
  const counted = set => comparison[set].map(item => ({
    set,
    item,
    severity: severityOfImpact(item.impact),
    warningOnly: scope === 'change' && (Boolean(tracked(scan.source, scan.check, item)) || Boolean(drift(item))),
  }));
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

  return findings.map(({ set, item, severity, warningOnly }) => {
    const onPage = set === 'newViolations' || set === 'grown';
    const path = onPage ? scan.pagesFile : scan.baselineFile;
    const line = (onPage ? pages.get(item.page) : baseline.get(entryKey(item))) ?? 1;

    return {
      path,
      start_line: line,
      end_line: line,
      annotation_level: comparison.mode === 'block' ? 'failure' : annotationLevel({ severity, warningOnly }),
      title: titles[set](item, severity),
      message: `${where(item)}. ${item.remedy}`,
    };
  }).sort((a, b) => a.path.localeCompare(b.path) || a.start_line - b.start_line);
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
