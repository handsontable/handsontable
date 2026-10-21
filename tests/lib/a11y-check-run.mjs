/**
 * The `A11y / axe report` check run: the pure half.
 *
 * The axe job's own check is green in warn mode whatever the scan found, so a
 * finding would sit unseen in the job summary. This check run is the visible
 * gate on the pull request: `neutral` (a grey icon, with the counts in its title)
 * when a finding needs action in warn mode, `success` when nothing does,
 * `failure` in block mode or on a tooling failure. Its page carries the job
 * summary and the link to the HTML report, and its annotations sit on the line
 * of the file to change: a new or grown finding on the page's entry in
 * `tests/a11y/pages.mjs`, an improved or fixed one on its entry in the baseline.
 * It never blocks a merge: only `CI Gate` is required.
 *
 * `tests/scripts/a11y-check-run.mjs` reads the reporter's `comparison.json`,
 * builds the payload here, and posts it. No I/O in here.
 */
import { BASELINE_FILE, entryKey, headline, renderSummary, verdictCounts } from './a11y-baseline.mjs';

export const CHECK_RUN_NAME = 'A11y / axe report';
export const ANNOTATIONS_PER_REQUEST = 50;
// The Checks API refuses an output summary over 65,535 characters.
const SUMMARY_LIMIT = 65000;
const PAGES_FILE = 'tests/a11y/pages.mjs';

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
 * @returns {{name: string, conclusion: string, title: string, summary: string, annotations: object[]}} The payload.
 */
export function buildCheckRun({ comparison, pages, baseline, reportUrl, runUrl }) {
  if (!comparison) {
    return {
      name: CHECK_RUN_NAME,
      conclusion: 'failure',
      title: '✖ The scan wrote no comparison',
      summary: `The axe job ended without \`tests/test-results/a11y/comparison.json\`, so nothing was compared. ${runLink(runUrl)}`,
      annotations: [],
    };
  }

  const counts = verdictCounts(comparison);
  const problems = comparison.problems ?? [];
  let conclusion = 'success';

  if (problems.length > 0) {
    conclusion = 'failure';
  } else if (counts.action > 0) {
    conclusion = comparison.mode === 'block' ? 'failure' : 'neutral';
  }

  const title = problems.length > 0
    ? `✖ Tooling failure: ${problems[0]}`
    : `${counts.action === 0 ? '✔' : (comparison.mode === 'block' ? '✖' : '⚠')} ${headline(comparison)}`;
  const notes = [...(comparison.notes ?? []), ...problems.map(problem => `Tooling problem: ${problem}`)];
  const lead = [
    comparison.mode === 'block'
      ? '**Block mode:** a finding that needs action fails this check and the job.'
      : '**Warn mode:** this check is neutral when a finding needs action and never blocks a merge; blocking comes later.',
    runLink(runUrl),
    ...notes.map(note => `> ${note}`),
  ].filter(Boolean).join('\n\n');
  let summary = `${lead}\n\n${renderSummary(comparison, { reportUrl })}`;

  if (summary.length > SUMMARY_LIMIT) {
    summary = `${summary.slice(0, SUMMARY_LIMIT)}\n\n… cut at ${SUMMARY_LIMIT} characters; the HTML report and the job summary hold the rest.`;
  }

  return { name: CHECK_RUN_NAME, conclusion, title: title.slice(0, 250), summary, annotations: annotations(comparison, pages, baseline) };
}

/**
 * One annotation per finding that needs action, on the line of the file to change.
 *
 * @param {object} comparison The comparison.
 * @param {Map<string, number>} pages The page lines.
 * @param {Map<string, number>} baseline The baseline lines.
 * @returns {object[]} The annotations.
 */
function annotations(comparison, pages, baseline) {
  const level = comparison.mode === 'block' ? 'failure' : 'warning';
  const where = item => `${item.page} on ${item.theme}: ${item.rule} on ${item.target}`;
  const onPage = (item, title) => {
    const line = pages.get(item.page) ?? 1;

    return { path: PAGES_FILE, start_line: line, end_line: line, annotation_level: level, title, message: `${where(item)}. ${item.remedy}` };
  };
  const onEntry = (item, title) => {
    const line = baseline.get(entryKey(item)) ?? 1;

    return { path: `tests/${BASELINE_FILE}`, start_line: line, end_line: line, annotation_level: level, title, message: `${where(item)}. ${item.remedy}` };
  };

  return [
    ...comparison.newViolations.map(item => onPage(item, `New accessibility finding: ${item.rule}`)),
    ...comparison.grown.map(item => onPage(item, `Grown accessibility finding: ${item.rule}`)),
    ...comparison.improved.map(item => onEntry(item, `Improved: lower the recorded node count`)),
    ...comparison.stale.map(item => onEntry(item, `Fixed: delete the baseline entry`)),
  ];
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
