/**
 * The evidence shape of the accessibility checks beyond axe: the pure half.
 *
 * The axe scan (`a11y/axe.spec.ts`) reads the accessibility tree against axe's rules. The checks in
 * `a11y/checks/` measure what axe does not run: the keyboard, the tree's structure, focus and
 * contrast, reflow, forced colors and motion, pointer alternatives. Each is a Playwright project of
 * `playwright.a11y-checks.config.ts`, and each test of a check measures one target (a page of the
 * catalog, in a theme and a state) and attaches what it measured as an evidence part
 * (`EVIDENCE_ATTACHMENT`). The reporter (`reporters/a11y-checks.ts`) merges a check's parts into one
 * document, `test-results/a11y-checks/<check>.json` (`mergeEvidence()`), which the Accessibility
 * Conformance Report generator cites per criterion, and `scripts/a11y-evidence-report.mjs` turns
 * each document into the job summary and the `A11y / <check> report` check run
 * (`buildEvidenceCheckRun()`).
 *
 * Report-only: a finding is a row in the summary, an annotation and a `neutral` check run, never a
 * red job, and a check run is never `failure`. A test fails only for tooling (a fixture that does not
 * load, a state the keyboard did not reach), and that failure is recorded in the document as a
 * target with `status: 'error'` and as a problem: flakiness is a finding against the check, not the
 * product. The policy is `tests/AGENTS.md`, "A11y: the checks beyond axe". No I/O in here.
 */
import { escapeMarkdownText as escape, isSafeLink } from './a11y-baseline.mjs';

export const EVIDENCE_SCHEMA = 1;
/**
 * The only mode in this tier. Pinned by `lib/__tests__/a11y-evidence.test.mjs`: a check that starts
 * gating changes this constant, the test and `tests/AGENTS.md` together.
 */
export const EVIDENCE_MODE = 'report';
export const EVIDENCE_ATTACHMENT = 'a11y-evidence';
export const TARGET_ANNOTATION = 'a11y-target';
export const CHECK_RUN_PREFIX = 'A11y / ';
/**
 * The severity of a finding, worst first. The first four are axe's impacts, so a finding reads the
 * same in every report; `advisory` is a difference to review that is not a failure on its own (a
 * golden that moved).
 */
export const SEVERITIES = ['critical', 'serious', 'moderate', 'minor', 'advisory'];
export const TARGET_STATUSES = ['measured', 'error'];
export const PAGES_FILE = 'tests/a11y/pages.mjs';
// How many findings the summary lists, and how many annotations a check run carries; both say how
// many more the JSON holds.
const SUMMARY_FINDINGS = 60;
const ANNOTATIONS = 100;
// How many tooling problems a summary lists; it says how many more the JSON holds.
const SUMMARY_PROBLEMS = 20;
// The Checks API refuses an output summary over 65,535 characters.
const SUMMARY_LIMIT = 65000;
const CHECK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KIND_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Every WCAG 2.2 success criterion, with its name and level. 4.1.1 Parsing is obsolete in 2.2 and is
 * not here. A finding names criteria by these ids; `validateEvidence()` refuses any other.
 */
export const WCAG_CRITERIA = Object.freeze({
  '1.1.1': { name: 'Non-text Content', level: 'A' },
  '1.2.1': { name: 'Audio-only and Video-only (Prerecorded)', level: 'A' },
  '1.2.2': { name: 'Captions (Prerecorded)', level: 'A' },
  '1.2.3': { name: 'Audio Description or Media Alternative (Prerecorded)', level: 'A' },
  '1.2.4': { name: 'Captions (Live)', level: 'AA' },
  '1.2.5': { name: 'Audio Description (Prerecorded)', level: 'AA' },
  '1.2.6': { name: 'Sign Language (Prerecorded)', level: 'AAA' },
  '1.2.7': { name: 'Extended Audio Description (Prerecorded)', level: 'AAA' },
  '1.2.8': { name: 'Media Alternative (Prerecorded)', level: 'AAA' },
  '1.2.9': { name: 'Audio-only (Live)', level: 'AAA' },
  '1.3.1': { name: 'Info and Relationships', level: 'A' },
  '1.3.2': { name: 'Meaningful Sequence', level: 'A' },
  '1.3.3': { name: 'Sensory Characteristics', level: 'A' },
  '1.3.4': { name: 'Orientation', level: 'AA' },
  '1.3.5': { name: 'Identify Input Purpose', level: 'AA' },
  '1.3.6': { name: 'Identify Purpose', level: 'AAA' },
  '1.4.1': { name: 'Use of Color', level: 'A' },
  '1.4.2': { name: 'Audio Control', level: 'A' },
  '1.4.3': { name: 'Contrast (Minimum)', level: 'AA' },
  '1.4.4': { name: 'Resize Text', level: 'AA' },
  '1.4.5': { name: 'Images of Text', level: 'AA' },
  '1.4.6': { name: 'Contrast (Enhanced)', level: 'AAA' },
  '1.4.7': { name: 'Low or No Background Audio', level: 'AAA' },
  '1.4.8': { name: 'Visual Presentation', level: 'AAA' },
  '1.4.9': { name: 'Images of Text (No Exception)', level: 'AAA' },
  '1.4.10': { name: 'Reflow', level: 'AA' },
  '1.4.11': { name: 'Non-text Contrast', level: 'AA' },
  '1.4.12': { name: 'Text Spacing', level: 'AA' },
  '1.4.13': { name: 'Content on Hover or Focus', level: 'AA' },
  '2.1.1': { name: 'Keyboard', level: 'A' },
  '2.1.2': { name: 'No Keyboard Trap', level: 'A' },
  '2.1.3': { name: 'Keyboard (No Exception)', level: 'AAA' },
  '2.1.4': { name: 'Character Key Shortcuts', level: 'A' },
  '2.2.1': { name: 'Timing Adjustable', level: 'A' },
  '2.2.2': { name: 'Pause, Stop, Hide', level: 'A' },
  '2.2.3': { name: 'No Timing', level: 'AAA' },
  '2.2.4': { name: 'Interruptions', level: 'AAA' },
  '2.2.5': { name: 'Re-authenticating', level: 'AAA' },
  '2.2.6': { name: 'Timeouts', level: 'AAA' },
  '2.3.1': { name: 'Three Flashes or Below Threshold', level: 'A' },
  '2.3.2': { name: 'Three Flashes', level: 'AAA' },
  '2.3.3': { name: 'Animation from Interactions', level: 'AAA' },
  '2.4.1': { name: 'Bypass Blocks', level: 'A' },
  '2.4.2': { name: 'Page Titled', level: 'A' },
  '2.4.3': { name: 'Focus Order', level: 'A' },
  '2.4.4': { name: 'Link Purpose (In Context)', level: 'A' },
  '2.4.5': { name: 'Multiple Ways', level: 'AA' },
  '2.4.6': { name: 'Headings and Labels', level: 'AA' },
  '2.4.7': { name: 'Focus Visible', level: 'AA' },
  '2.4.8': { name: 'Location', level: 'AAA' },
  '2.4.9': { name: 'Link Purpose (Link Only)', level: 'AAA' },
  '2.4.10': { name: 'Section Headings', level: 'AAA' },
  '2.4.11': { name: 'Focus Not Obscured (Minimum)', level: 'AA' },
  '2.4.12': { name: 'Focus Not Obscured (Enhanced)', level: 'AAA' },
  '2.4.13': { name: 'Focus Appearance', level: 'AAA' },
  '2.5.1': { name: 'Pointer Gestures', level: 'A' },
  '2.5.2': { name: 'Pointer Cancellation', level: 'A' },
  '2.5.3': { name: 'Label in Name', level: 'A' },
  '2.5.4': { name: 'Motion Actuation', level: 'A' },
  '2.5.5': { name: 'Target Size (Enhanced)', level: 'AAA' },
  '2.5.6': { name: 'Concurrent Input Mechanisms', level: 'AAA' },
  '2.5.7': { name: 'Dragging Movements', level: 'AA' },
  '2.5.8': { name: 'Target Size (Minimum)', level: 'AA' },
  '3.1.1': { name: 'Language of Page', level: 'A' },
  '3.1.2': { name: 'Language of Parts', level: 'AA' },
  '3.1.3': { name: 'Unusual Words', level: 'AAA' },
  '3.1.4': { name: 'Abbreviations', level: 'AAA' },
  '3.1.5': { name: 'Reading Level', level: 'AAA' },
  '3.1.6': { name: 'Pronunciation', level: 'AAA' },
  '3.2.1': { name: 'On Focus', level: 'A' },
  '3.2.2': { name: 'On Input', level: 'A' },
  '3.2.3': { name: 'Consistent Navigation', level: 'AA' },
  '3.2.4': { name: 'Consistent Identification', level: 'AA' },
  '3.2.5': { name: 'Change on Request', level: 'AAA' },
  '3.2.6': { name: 'Consistent Help', level: 'A' },
  '3.3.1': { name: 'Error Identification', level: 'A' },
  '3.3.2': { name: 'Labels or Instructions', level: 'A' },
  '3.3.3': { name: 'Error Suggestion', level: 'AA' },
  '3.3.4': { name: 'Error Prevention (Legal, Financial, Data)', level: 'AA' },
  '3.3.5': { name: 'Help', level: 'AAA' },
  '3.3.6': { name: 'Error Prevention (All)', level: 'AAA' },
  '3.3.7': { name: 'Redundant Entry', level: 'A' },
  '3.3.8': { name: 'Accessible Authentication (Minimum)', level: 'AA' },
  '3.3.9': { name: 'Accessible Authentication (Enhanced)', level: 'AAA' },
  '4.1.2': { name: 'Name, Role, Value', level: 'A' },
  '4.1.3': { name: 'Status Messages', level: 'AA' },
});

/**
 * The checks this tier runs: one Playwright project each, named by the key. `criteria` is what the
 * check evidences, and what the conformance report generator cites it for; a finding may name a
 * criterion outside the list when the measurement shows it (a focus stop with no name is a 4.1.2
 * fact the keyboard walker sees), but a target counts as evaluating only the check's own criteria
 * unless it says otherwise. Each pull request that adds a check adds its entry.
 */
export const EVIDENCE_CHECKS = Object.freeze({});

/**
 * The commit a run tested, for the document's `run.commit`: `A11Y_HEAD_SHA` (the pull request's head,
 * which the workflow passes), otherwise `GITHUB_SHA` or the checkout's `HEAD`. On a pull request both
 * of those are the merge commit, which sits on no branch, so there the commit is unknown (`null`)
 * rather than wrong.
 *
 * @param {Record<string, string|undefined>} env The environment.
 * @param {() => string|null} readHead Reads the checkout's `HEAD`.
 * @returns {string|null} The commit.
 */
export function runCommit(env, readHead) {
  if (env.A11Y_HEAD_SHA) {
    return env.A11Y_HEAD_SHA;
  }
  if (env.GITHUB_EVENT_NAME?.startsWith('pull_request')) {
    return null;
  }

  return env.GITHUB_SHA || readHead();
}

/**
 * A criterion's name and level, or `null` for an id WCAG 2.2 does not have.
 *
 * @param {string} id The criterion (`2.4.3`).
 * @returns {{id: string, name: string, level: string}|null} The criterion.
 */
export function criterionInfo(id) {
  const info = Object.hasOwn(WCAG_CRITERIA, id) ? WCAG_CRITERIA[id] : null;

  return info ? { id, ...info } : null;
}

/**
 * Sorts criterion ids the way WCAG numbers them (`1.4.10` after `1.4.9`).
 *
 * @param {string} a A criterion.
 * @param {string} b Another.
 * @returns {number} The order.
 */
export function compareCriteria(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);

  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

/**
 * The name of a check's check run.
 *
 * @param {string} check The check id (`keyboard-walker`).
 * @returns {string} The name (`A11y / keyboard-walker report`).
 */
export function checkRunName(check) {
  return `${CHECK_RUN_PREFIX}${check} report`;
}

/**
 * The file name a target's detail goes to, inside the check's folder: the page, the theme and the
 * variant, so two targets never share one.
 *
 * @param {{page: string, theme: string, variant?: string|null}} target The target.
 * @returns {string} The file name, `<page>--<theme>[--<variant>].json`.
 */
export function targetFileName(target) {
  return `${[target.page, target.theme, target.variant].filter(Boolean).join('--')}.json`;
}

/**
 * The key that names a target within a check: page, theme and variant.
 *
 * @param {{page: string, theme: string, variant?: string|null}} target The target.
 * @returns {string} The key.
 */
export function targetKey(target) {
  return [target.page, target.theme, target.variant ?? ''].join('|');
}

/**
 * A finding's stable id within a run: what it is (the kind) and where (the target, and the element, the
 * step or both). Two runs that find the same thing give it the same id, so a later run can be compared
 * with an earlier one. A finding that names both keys on both: one element can show the same kind at
 * two steps (a focus indicator after `Tab 2` and after `ArrowDown from (1, 1)`), and those are two findings. The
 * state is not in it: a target has one state (`mergeEvidence()` keeps one part per target).
 *
 * @param {string} check The check.
 * @param {object} finding The finding, with its target fields.
 * @returns {string} The id.
 */
export function findingId(check, finding) {
  const place = finding.selector && finding.step ? [finding.selector, finding.step] : [finding.selector ?? finding.step ?? ''];

  return [check, finding.kind, finding.page, finding.theme, finding.variant ?? '', ...place].join('|');
}

/**
 * The problems of one evidence part, the document a check's test attaches for its target. An empty
 * list means it is well formed.
 *
 * @param {unknown} part The part.
 * @returns {string[]} The problems.
 */
export function validatePart(part) {
  const problems = [];

  if (!isObject(part)) {
    return ['the part is not an object'];
  }
  if (part.schema !== EVIDENCE_SCHEMA) {
    problems.push(`schema is ${JSON.stringify(part.schema)}, not ${EVIDENCE_SCHEMA}`);
  }
  problems.push(...targetProblems(part.target, 'target'));
  if (!Number.isFinite(part.durationMs) || part.durationMs < 0) {
    problems.push('durationMs is not a non-negative number');
  }
  if (part.criteria !== undefined) {
    problems.push(...criteriaProblems(part.criteria, 'criteria'));
  }
  if (!Array.isArray(part.findings)) {
    problems.push('findings is not an array');
  } else {
    part.findings.forEach((finding, index) => problems.push(...findingProblems(finding, `findings[${index}]`)));
  }

  return problems;
}

/**
 * Merges the parts one check's tests attached into the check's evidence document.
 *
 * @param {object} input What the run left.
 * @param {string} input.check The check id (the Playwright project's name).
 * @param {object[]} input.parts The evidence parts of the tests that measured their target.
 * @param {Array<{title: string, target: object|null, error: string, flaky?: boolean}>} [input.failures]
 *   The tests that did not measure (`error`), and the ones that measured only on a retry (`flaky`).
 * @param {object} [input.run] The run's metadata: commit, ref, runUrl, startedAt, durationMs.
 * @param {string[]} [input.problems] Tooling problems found while reading.
 * @param {Record<string, {title: string, criteria: string[]}>} [input.checks] The registry; defaults to `EVIDENCE_CHECKS`.
 * @returns {object} The evidence document.
 */
export function mergeEvidence({ check, parts, failures = [], run = {}, problems = [], checks = EVIDENCE_CHECKS }) {
  const definition = Object.hasOwn(checks, check) ? checks[check] : null;
  const all = [...problems];

  if (!definition) {
    all.push(`"${check}" is not a check of EVIDENCE_CHECKS (tests/lib/a11y-evidence.mjs); add its entry with its criteria`);
  }

  const criteria = definition ? [...definition.criteria] : [];
  const valid = [];
  const seen = new Set();

  for (const part of parts) {
    const partProblems = validatePart(part);

    if (partProblems.length > 0) {
      all.push(`an evidence part of ${describeTarget(part?.target)} is malformed: ${partProblems.join('; ')}`);
    } else if (seen.has(targetKey(part.target))) {
      // A target is its page, theme and variant, and its detail file is named by them: a second part for
      // one target would count it twice and overwrite its detail. The first is kept.
      all.push(`two evidence parts name ${describeTarget(part.target)}: the second is dropped; give each target its own variant`);
    } else {
      seen.add(targetKey(part.target));
      valid.push(part);
    }
  }

  const flaky = new Set(failures.filter(item => item.flaky && item.target).map(item => targetKey(item.target)));
  const targets = valid.map(part => ({
    page: part.target.page,
    theme: part.target.theme,
    state: part.target.state ?? null,
    variant: part.target.variant ?? null,
    url: part.target.url ?? null,
    status: 'measured',
    criteria: [...(part.criteria ?? criteria)].sort(compareCriteria),
    durationMs: Math.round(part.durationMs),
    findings: part.findings.length,
    flaky: flaky.has(targetKey(part.target)),
    detail: part.detail === undefined ? null : `${check}/${targetFileName(part.target)}`,
  }));

  for (const failure of failures.filter(item => !item.flaky)) {
    targets.push({
      page: failure.target?.page ?? null,
      theme: failure.target?.theme ?? null,
      state: failure.target?.state ?? null,
      variant: failure.target?.variant ?? null,
      url: failure.target?.url ?? null,
      status: 'error',
      criteria: [],
      durationMs: null,
      findings: 0,
      flaky: false,
      detail: null,
      error: firstLine(failure.error),
    });
    all.push(`${failure.title} did not measure: ${firstLine(failure.error)}`);
  }
  for (const failure of failures.filter(item => item.flaky)) {
    all.push(`${failure.title} measured only on a retry (a flaky check is a finding against the check): ${firstLine(failure.error)}`);
  }

  // A target the reporter could not name (a test that failed before it declared one) sorts last.
  targets.sort((a, b) => Number(a.page === null) - Number(b.page === null)
    || String(a.page).localeCompare(String(b.page)) || String(a.theme).localeCompare(String(b.theme))
    || String(a.variant ?? '').localeCompare(String(b.variant ?? '')));

  const findings = valid.flatMap(part => part.findings.map((finding) => {
    // The target's fields and the id come last, so a finding that carries its own cannot move itself.
    const located = {
      ...finding,
      page: part.target.page,
      theme: part.target.theme,
      state: part.target.state ?? null,
      variant: part.target.variant ?? null,
      url: part.target.url ?? null,
      criteria: [...finding.criteria].sort(compareCriteria),
    };

    return { ...located, id: findingId(check, located) };
  }));

  // An id names one finding: two that share one read as one in a diff between runs.
  for (const [id, count] of Object.entries(countBy(findings, finding => finding.id))) {
    if (count > 1) {
      all.push(`${count} findings share the id ${id}: give each its own selector or step`);
    }
  }

  findings.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity)
    || a.id.localeCompare(b.id));

  const environment = valid.find(part => isObject(part.environment))?.environment ?? {};

  return {
    schema: EVIDENCE_SCHEMA,
    check,
    title: definition?.title ?? check,
    mode: EVIDENCE_MODE,
    criteria,
    run: {
      commit: run.commit ?? null,
      ref: run.ref ?? null,
      runUrl: run.runUrl ?? null,
      startedAt: run.startedAt ?? null,
      durationMs: run.durationMs ?? null,
      project: check,
      browser: environment.browser ?? null,
      browserVersion: environment.browserVersion ?? null,
      handsontableVersion: environment.handsontableVersion ?? null,
      handsontableBuildDate: environment.handsontableBuildDate ?? null,
    },
    targets,
    findings,
    problems: all,
    summary: summarize({ criteria, targets, findings }),
  };
}

/**
 * The counts of a document: targets measured and errored, findings by severity, by kind and by
 * criterion. A criterion's `evaluated` is the number of measured targets that evaluated it: what the
 * conformance report cites as evidence that the criterion was checked, findings or none.
 *
 * @param {{criteria: string[], targets: object[], findings: object[]}} input The document's lists.
 * @returns {object} The summary.
 */
function summarize({ criteria, targets, findings }) {
  const measured = targets.filter(target => target.status === 'measured');
  const ids = new Set([...criteria, ...findings.flatMap(finding => finding.criteria)]);
  const byCriterion = {};

  for (const id of [...ids].sort(compareCriteria)) {
    const own = findings.filter(finding => finding.criteria.includes(id));

    byCriterion[id] = {
      name: WCAG_CRITERIA[id]?.name ?? null,
      level: WCAG_CRITERIA[id]?.level ?? null,
      evaluated: measured.filter(target => target.criteria.includes(id)).length,
      findings: own.length,
      pages: [...new Set(own.map(finding => finding.page))].sort(),
    };
  }

  return {
    targets: targets.length,
    measured: measured.length,
    errors: targets.length - measured.length,
    flaky: targets.filter(target => target.flaky).length,
    findings: findings.length,
    bySeverity: Object.fromEntries(SEVERITIES.map(severity => [severity, findings.filter(finding => finding.severity === severity).length])),
    byKind: countBy(findings, finding => finding.kind),
    byCriterion,
  };
}

/**
 * The problems of an evidence document, as the reporter wrote it. An empty list means the generator
 * can read it.
 *
 * @param {unknown} doc The document.
 * @param {{checks?: Record<string, object>}} [options] The registry; defaults to `EVIDENCE_CHECKS`.
 * @returns {string[]} The problems.
 */
export function validateEvidence(doc, { checks = EVIDENCE_CHECKS } = {}) {
  const problems = [];

  if (!isObject(doc)) {
    return ['the document is not an object'];
  }
  if (doc.schema !== EVIDENCE_SCHEMA) {
    problems.push(`schema is ${JSON.stringify(doc.schema)}, not ${EVIDENCE_SCHEMA}`);
  }
  if (typeof doc.check !== 'string' || !CHECK_ID.test(doc.check)) {
    problems.push('check is not a kebab-case id');
  } else if (!Object.hasOwn(checks, doc.check)) {
    problems.push(`check "${doc.check}" is not in EVIDENCE_CHECKS`);
  }
  if (typeof doc.title !== 'string' || doc.title === '') {
    problems.push('title is not a non-empty string');
  }
  if (doc.mode !== EVIDENCE_MODE) {
    problems.push(`mode is ${JSON.stringify(doc.mode)}, not ${JSON.stringify(EVIDENCE_MODE)}`);
  }
  problems.push(...criteriaProblems(doc.criteria, 'criteria'));
  if (!isObject(doc.run)) {
    problems.push('run is not an object');
  }
  if (!Array.isArray(doc.targets)) {
    problems.push('targets is not an array');
  } else {
    doc.targets.forEach((target, index) => {
      if (!TARGET_STATUSES.includes(target?.status)) {
        problems.push(`targets[${index}].status is ${JSON.stringify(target?.status)}, not one of ${TARGET_STATUSES.join(', ')}`);
      }
      if (target?.status === 'measured') {
        problems.push(...targetProblems(target, `targets[${index}]`));
        problems.push(...criteriaProblems(target.criteria, `targets[${index}].criteria`));
      }
    });
  }
  if (!Array.isArray(doc.findings)) {
    problems.push('findings is not an array');
  } else {
    doc.findings.forEach((finding, index) => {
      problems.push(...findingProblems(finding, `findings[${index}]`));
      problems.push(...targetProblems(finding, `findings[${index}]`));
      if (typeof finding?.id !== 'string' || finding.id === '') {
        problems.push(`findings[${index}].id is missing`);
      }
    });
  }
  if (!Array.isArray(doc.problems)) {
    problems.push('problems is not an array');
  }
  problems.push(...summaryProblems(doc.summary));

  return problems;
}

/**
 * The one-line verdict of a document, for the check run's title and the summary.
 *
 * @param {object} doc The document.
 * @returns {string} The headline.
 */
export function evidenceHeadline(doc) {
  const { summary } = doc;
  const severities = SEVERITIES.filter(severity => summary.bySeverity[severity] > 0)
    .map(severity => `${summary.bySeverity[severity]} ${severity}`);
  const targets = `${summary.measured} ${summary.measured === 1 ? 'target' : 'targets'} measured`;
  const errors = summary.errors > 0 ? `, ${summary.errors} not measured` : '';
  const found = summary.findings === 0
    ? 'No findings'
    : `${summary.findings} ${summary.findings === 1 ? 'finding' : 'findings'} (${severities.join(', ')})`;

  return `${found} on ${targets}${errors}`;
}

/**
 * The job summary of one document: the headline, the criteria it evidences with their counts, the
 * findings (the first sixty), and the tooling problems. Every value is escaped, because GitHub
 * renders the summary as markdown and the values come from the fixture DOM.
 *
 * @param {object} doc The document.
 * @param {{reportUrl?: string, runUrl?: string, artifactUrl?: string}} [links] The links to add.
 * @returns {string} Markdown.
 */
export function renderEvidenceSummary(doc, { runUrl, artifactUrl } = {}) {
  const lines = [`### ${escape(doc.title)} (\`${escape(doc.check)}\`)`, '', `**${escape(evidenceHeadline(doc))}.** Report-only: a finding never fails the job.`, ''];
  const links = [
    isSafeLink(artifactUrl) ? `[The evidence JSON](${artifactUrl})` : '',
    isSafeLink(runUrl) ? `[The workflow run](${runUrl})` : '',
  ].filter(Boolean);

  if (links.length > 0) {
    lines.push(links.join(' · '), '');
  }

  lines.push('| Criterion | Level | Targets evaluated | Findings |', '| --- | :-: | --: | --: |');
  for (const [id, entry] of Object.entries(doc.summary.byCriterion)) {
    lines.push(`| ${escape(id)} ${escape(entry.name ?? '')} | ${escape(entry.level ?? '')} | ${entry.evaluated} | ${entry.findings} |`);
  }
  lines.push('');

  if (doc.findings.length > 0) {
    lines.push('| Severity | Criteria | Page | Theme | Where | Finding |', '| --- | --- | --- | --- | --- | --- |');
    for (const finding of doc.findings.slice(0, SUMMARY_FINDINGS)) {
      const page = finding.variant ? `${finding.page} (${finding.variant})` : finding.page;

      lines.push(`| ${escape(finding.severity)} | ${escape(finding.criteria.join(', '))} | ${escape(page)} | ${escape(finding.theme)} | ${where(finding)} | ${escape(findingText(finding))} |`);
    }
    if (doc.findings.length > SUMMARY_FINDINGS) {
      lines.push('', `… and ${doc.findings.length - SUMMARY_FINDINGS} more in \`test-results/a11y-checks/${escape(doc.check)}.json\`.`);
    }
    lines.push('');
  }

  if (doc.problems.length > 0) {
    lines.push('**Tooling problems** (a finding against the check, not the product):', '', ...problemLines(doc.problems, ' in the JSON'), '');
  }

  return lines.join('\n');
}

/**
 * The `A11y / <check> report` check run of one document. `neutral` when anything needs a look (a
 * finding, an advisory difference, a target that was not measured, a malformed document), `success`
 * when nothing does, and never `failure`: these checks are report-only, so a check run never turns a
 * pull request red. One annotation per finding, up to a hundred, on the page's line in
 * `tests/a11y/pages.mjs`, or on the file and line the finding names (`file`, `line`).
 *
 * @param {object} input The input.
 * @param {object|null} input.doc The document, or `null` when the check left none.
 * @param {string} [input.check] The check id, for a check that left no document.
 * @param {string[]} [input.problems] Problems found reading the document (it did not parse, or did not validate).
 * @param {Map<string, number>} [input.pages] The page lines (`pageLines()` of `lib/a11y-check-run.mjs`).
 * @param {string} [input.runUrl] The workflow run's URL.
 * @param {string} [input.artifactUrl] The evidence artifact's URL.
 * @returns {{name: string, conclusion: 'success'|'neutral', title: string, summary: string, annotations: object[]}} The payload.
 */
export function buildEvidenceCheckRun({ doc, check, problems = [], pages = new Map(), runUrl, artifactUrl }) {
  const name = checkRunName(doc?.check ?? check ?? 'unknown');

  if (!doc || problems.length > 0) {
    const reason = problems[0] ?? 'the check left no evidence document';

    return {
      name,
      conclusion: 'neutral',
      title: `⚠ Tooling: ${reason}`.slice(0, 250),
      summary: capSummary([
        'Report-only: this check run is never a failure. The check did not leave a document the report generator can read, which is a problem with the check, not a finding on the product.',
        '',
        ...problemLines(problems, ''),
        isSafeLink(runUrl) ? `\n[The workflow run](${runUrl})` : '',
      ].join('\n'), 'the evidence artifact holds the document'),
      annotations: [],
    };
  }

  const attention = doc.findings.length > 0 || doc.problems.length > 0 || doc.summary.errors > 0;
  const headline = evidenceHeadline(doc);
  const summary = capSummary(renderEvidenceSummary(doc, { runUrl, artifactUrl }), 'the job summary and the JSON hold the rest');

  const annotations = doc.findings.slice(0, ANNOTATIONS).map((finding) => {
    const path = finding.file ?? PAGES_FILE;
    const line = finding.line ?? (finding.file ? 1 : pages.get(finding.page) ?? 1);

    return {
      path,
      start_line: line,
      end_line: line,
      annotation_level: finding.severity === 'advisory' || finding.severity === 'minor' ? 'notice' : 'warning',
      title: `${finding.criteria.join(', ')} ${finding.kind}`.slice(0, 250),
      message: `${finding.page} on ${finding.theme}${finding.variant ? ` (${finding.variant})` : ''}: ${findingText(finding)}${locationText(finding)}`,
    };
  });

  return {
    name,
    conclusion: attention ? 'neutral' : 'success',
    title: `${attention ? '⚠' : '✔'} ${headline}${doc.problems.length > 0 ? ` · ${doc.problems.length} tooling ${doc.problems.length === 1 ? 'problem' : 'problems'}` : ''}`.slice(0, 250),
    summary,
    annotations,
  };
}

/**
 * Tooling problems as list items: the first twenty, then how many more there are.
 *
 * @param {string[]} problems The problems.
 * @param {string} rest Where the rest are, as a phrase that follows "more" (` in the JSON`), or empty.
 * @returns {string[]} The lines.
 */
function problemLines(problems, rest) {
  const lines = problems.slice(0, SUMMARY_PROBLEMS).map(problem => `- ${escape(problem)}`);

  return problems.length > SUMMARY_PROBLEMS ? [...lines, `- … and ${problems.length - SUMMARY_PROBLEMS} more${rest}.`] : lines;
}

/**
 * A check run's summary cut to what the Checks API takes: a longer one is refused (422), and the
 * script would then post no check run for the checks after it.
 *
 * @param {string} summary The summary.
 * @param {string} rest Where the rest can be read.
 * @returns {string} The summary, at most `SUMMARY_LIMIT` characters and the note that it was cut.
 */
function capSummary(summary, rest) {
  return summary.length > SUMMARY_LIMIT ? `${summary.slice(0, SUMMARY_LIMIT)}\n\n… cut at ${SUMMARY_LIMIT} characters; ${rest}.` : summary;
}

/**
 * The reason of a finding with its measured values, one line.
 *
 * @param {object} finding The finding.
 * @returns {string} The text.
 */
export function findingText(finding) {
  const measured = isObject(finding.measured) ? measuredText(finding.measured) : '';

  return measured ? `${finding.reason} (${measured})` : finding.reason;
}

/**
 * Measured values as `key=value` pairs, numbers rounded to two decimals, nested values as JSON.
 *
 * @param {Record<string, unknown>} measured The values.
 * @returns {string} The text.
 */
export function measuredText(measured) {
  return Object.entries(measured).map(([key, value]) => {
    if (typeof value === 'number') {
      return `${key}=${Number.isInteger(value) ? value : value.toFixed(2)}`;
    }

    return `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`;
  }).join(', ');
}

/**
 * Where a finding is, for the summary's table: the selector in a `<code>` element (a backtick span
 * cannot escape a backslash), or the step in words.
 *
 * @param {object} finding The finding.
 * @returns {string} The cell.
 */
function where(finding) {
  if (finding.selector) {
    return `<code>${escape(finding.selector)}</code>`;
  }

  return escape(finding.step ?? '');
}

/**
 * The location of a finding, for an annotation's message.
 *
 * @param {object} finding The finding.
 * @returns {string} The text, starting with a period and a space, or empty.
 */
function locationText(finding) {
  const parts = [finding.selector ? `Element: ${finding.selector}` : '', finding.step ? `Step: ${finding.step}` : '', finding.url ? `Fixture: ${finding.url}` : '']
    .filter(Boolean);

  return parts.length > 0 ? `. ${parts.join('. ')}` : '';
}

/**
 * The problems of a target's fields.
 *
 * @param {unknown} target The target.
 * @param {string} label Where it sits.
 * @returns {string[]} The problems.
 */
function targetProblems(target, label) {
  if (!isObject(target)) {
    return [`${label} is not an object`];
  }

  const problems = [];

  for (const field of ['page', 'theme']) {
    if (typeof target[field] !== 'string' || target[field] === '') {
      problems.push(`${label}.${field} is not a non-empty string`);
    }
  }
  for (const field of ['state', 'variant', 'url']) {
    if (target[field] !== undefined && target[field] !== null && typeof target[field] !== 'string') {
      problems.push(`${label}.${field} is not a string`);
    }
  }

  return problems;
}

/**
 * The problems of a document's summary: every count `evidenceHeadline()`, `renderEvidenceSummary()` and
 * `buildEvidenceCheckRun()` read, so a document that validates renders without a throw.
 *
 * @param {unknown} summary The summary.
 * @returns {string[]} The problems.
 */
function summaryProblems(summary) {
  if (!isObject(summary)) {
    return ['summary is not an object'];
  }

  const problems = [];

  for (const field of ['targets', 'measured', 'errors', 'flaky', 'findings']) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) {
      problems.push(`summary.${field} is not a non-negative integer`);
    }
  }
  if (!isObject(summary.bySeverity) || SEVERITIES.some(severity => !Number.isInteger(summary.bySeverity[severity]))) {
    problems.push(`summary.bySeverity does not count every severity (${SEVERITIES.join(', ')})`);
  }
  if (!isObject(summary.byCriterion)) {
    problems.push('summary.byCriterion is missing');
  } else {
    for (const [id, entry] of Object.entries(summary.byCriterion)) {
      if (!isObject(entry) || !Number.isInteger(entry.evaluated) || !Number.isInteger(entry.findings)) {
        problems.push(`summary.byCriterion[${JSON.stringify(id)}] does not count its evaluated targets and findings`);
      }
    }
  }

  return problems;
}

/**
 * The problems of a list of criteria.
 *
 * @param {unknown} criteria The list.
 * @param {string} label Where it sits.
 * @returns {string[]} The problems.
 */
function criteriaProblems(criteria, label) {
  if (!Array.isArray(criteria)) {
    return [`${label} is not an array`];
  }

  return criteria.filter(id => !Object.hasOwn(WCAG_CRITERIA, id)).map(id => `${label} names ${JSON.stringify(id)}, which is not a WCAG 2.2 criterion`);
}

/**
 * The problems of one finding's own fields.
 *
 * @param {unknown} finding The finding.
 * @param {string} label Where it sits.
 * @returns {string[]} The problems.
 */
function findingProblems(finding, label) {
  if (!isObject(finding)) {
    return [`${label} is not an object`];
  }

  const problems = [];

  if (typeof finding.kind !== 'string' || !KIND_ID.test(finding.kind)) {
    problems.push(`${label}.kind is not a kebab-case id`);
  }
  if (!Array.isArray(finding.criteria) || finding.criteria.length === 0) {
    problems.push(`${label}.criteria is not a non-empty array`);
  } else {
    problems.push(...criteriaProblems(finding.criteria, `${label}.criteria`));
  }
  if (!SEVERITIES.includes(finding.severity)) {
    problems.push(`${label}.severity is ${JSON.stringify(finding.severity)}, not one of ${SEVERITIES.join(', ')}`);
  }
  if (typeof finding.reason !== 'string' || finding.reason.trim() === '') {
    problems.push(`${label}.reason is empty`);
  }
  if (typeof finding.selector !== 'string' && typeof finding.step !== 'string') {
    problems.push(`${label} names neither a selector nor a step`);
  }
  if (finding.measured !== undefined && !isObject(finding.measured)) {
    problems.push(`${label}.measured is not an object`);
  }
  if (finding.file !== undefined && (typeof finding.file !== 'string' || !/^tests\/[\w./-]+$/.test(finding.file))) {
    problems.push(`${label}.file is not a path under tests/`);
  }
  if (finding.line !== undefined && !(Number.isInteger(finding.line) && finding.line > 0)) {
    problems.push(`${label}.line is not a positive integer`);
  }

  return problems;
}

/**
 * A target, in words, for a problem.
 *
 * @param {unknown} target The target.
 * @returns {string} The text.
 */
function describeTarget(target) {
  return isObject(target) ? `${target.page} on ${target.theme}${target.variant ? ` (${target.variant})` : ''}` : 'an unknown target';
}

/**
 * Counts items by a key, most first, then by key.
 *
 * @param {object[]} items The items.
 * @param {Function} keyOf The key.
 * @returns {Record<string, number>} The counts.
 */
function countBy(items, keyOf) {
  const counts = new Map();

  for (const item of items) {
    counts.set(keyOf(item), (counts.get(keyOf(item)) ?? 0) + 1);
  }

  return Object.fromEntries([...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

/**
 * The first line of an error, with terminal colors stripped.
 *
 * @param {unknown} error The error text.
 * @returns {string} The line.
 */
function firstLine(error) {
  // eslint-disable-next-line no-control-regex
  return String(error ?? 'unknown error').replace(/\u001b\[[0-9;]*m/g, '').split('\n').find(line => line.trim())?.trim() ?? 'unknown error';
}

/**
 * Whether a value is a plain object.
 *
 * @param {unknown} value The value.
 * @returns {boolean} Whether it is.
 */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
