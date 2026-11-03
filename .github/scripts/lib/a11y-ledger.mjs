/**
 * The accessibility findings ledger: the pure half.
 *
 * Every weeknight the `A11y nightly` leaves one evidence document per check beyond axe
 * (`a11y-checks-evidence`, `tests/lib/a11y-evidence.mjs`) and the axe scan's findings
 * (`a11y-axe-results`, `tests/lib/a11y-findings.mjs`), and the `Screen reader nightly` leaves one
 * transcript per scenario and project (`screenreader-transcripts-<project>`,
 * `tests/lib/screenreader-transcript.mjs`). A raw night holds thousands of records, most of them the
 * same few defects on many pages, and nothing used to accumulate across nights or deduplicate across
 * checks. This module turns a night's artifacts into findings keyed so that a finding keeps its
 * identity across nights (`readA11yArtifacts`, `findingKey`), merges them into the ledger on `gh-pages`
 * (`test-health/a11y.json`, `mergeA11yLedger`) as one row per finding with when it was first and last
 * seen, how many nights it was seen, its status (`new`, `persisting`, `flapping`, `resolved`), and the
 * root-cause cluster the catalog (`tests/a11y/issues.json`, `tests/lib/a11y-issues.mjs`) sorts it into,
 * and derives what the page draws (`a11yView`).
 *
 * The rules that keep the ledger honest:
 *
 * - Develop only (`isA11yRun`). The nightlies are schedules, so the rule is the branch, not a push.
 * - A night is read once. A run already recorded, or one that completed before the latest night of its
 *   source, changes nothing: statuses are derived night by night, in order.
 * - A row is resolved only when its target was measured again and the finding was gone: a check that did
 *   not run, a target that errored, an incomplete axe scan or a transcript that stopped leaves its rows as
 *   they were. A row that comes back after being resolved is `flapping` until it has been seen on
 *   `A11Y_FLAP_NIGHTS` nights in a row.
 * - The artifacts are a nightly's, on develop, but they are read as untrusted input all the same: every
 *   document and transcript is checked field by field, every string is bounded, a file over the cap is
 *   skipped, and the page builds links from run numbers alone.
 * - Rows stay `A11Y_RETENTION_DAYS` from their last sighting; past `A11Y_CAP_BYTES` the oldest resolved rows
 *   go first, then the oldest nights.
 * - `updatedAt` moves only when the stored text changed, so a collection that adds nothing leaves the
 *   published file byte-identical, like the flake ledger and the durations document.
 *
 * No I/O in here. `scripts/test-health-collect.mjs` reads the artifacts and writes the file;
 * `.github/workflows/test-health.yml` runs it. The policy is `tests/AGENTS.md`, "A11y: the findings ledger
 * and the cluster catalog".
 */

import { EVIDENCE_CHECKS, EVIDENCE_SCHEMA, SEVERITIES, WCAG_CRITERIA, compareCriteria } from '../../../tests/lib/a11y-evidence.mjs';
import { TRIAGE_ID, clusterOf, maskSelector } from '../../../tests/lib/a11y-issues.mjs';

export const A11Y_VERSION = 1;
/**
 * How long a row stays after its last sighting: the flake ledger's window, long enough to see a finding
 * return after a fix that did not hold.
 */
export const A11Y_RETENTION_DAYS = 90;
/**
 * The most the stored document may weigh. A night of every check is about 5,000 rows, and a row persists
 * rather than multiplies, so the open rows of the whole product weigh about 4.5 MB (measured on the first
 * nightly, every row with its key, reason and url); the rest is the resolved rows of the last 90 days and
 * the nights. Past the cap, the oldest resolved rows go first, then the oldest nights (the trend), never an
 * open row.
 */
export const A11Y_CAP_BYTES = 12 * 1024 * 1024;
/**
 * A file larger than this is skipped with a note: the largest real document (the discovery run) is under
 * 4 MiB, and nothing should read a forged one into memory without bound.
 */
export const A11Y_FILE_CAP_BYTES = 16 * 1024 * 1024;
/**
 * How many nights of each source the page draws in a cluster's trend.
 */
export const A11Y_TREND_NIGHTS = 30;
/**
 * A row that was resolved and came back is `flapping` until it has been seen this many nights in a row
 * since the gap; after that it is `persisting` again.
 */
export const A11Y_FLAP_NIGHTS = 5;
/**
 * How many triage shapes the page lists; the section title gives the full count.
 */
export const A11Y_TRIAGE_SHOWN = 100;
export const A11Y_EVIDENCE_ARTIFACT = 'a11y-checks-evidence';
export const A11Y_AXE_ARTIFACT = 'a11y-axe-results';
/**
 * The axe scan's concise findings, at the axe artifact's root (`tests/lib/a11y-findings.mjs` writes it).
 */
export const A11Y_AXE_FILE = 'a11y-findings.json';
export const A11Y_AXE_SCHEMA = 1;
export const READER_ARTIFACT_PREFIX = 'screenreader-transcripts-';
/**
 * Where the transcripts sit inside a reader artifact: `tests/screenreader/screenreader.spec.ts` writes
 * `test-results/screenreader/transcripts/<project>--<scenario>.json`, and the upload strips the common
 * `tests/test-results/screenreader/` prefix.
 */
export const READER_TRANSCRIPTS_DIR = 'transcripts';
export const READER_TRANSCRIPT_SCHEMA = 1;
/**
 * The two workflows whose runs the ledger reads, by their `name:`; `__tests__/a11y-ledger.test.mjs` pins
 * both against the workflow files and `test-health.yml`'s trigger list.
 */
export const A11Y_NIGHTLY_WORKFLOW = 'A11y nightly';
export const READER_NIGHTLY_WORKFLOW = 'Screen reader nightly';

const DAY_MS = 24 * 60 * 60 * 1000;
const LIMITS = Object.freeze({ findings: 20000, steps: 500, where: 300, reason: 300, url: 300, issues: 200, locations: 20000 });
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAGE_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const THEME = /^[a-z0-9-]{1,40}$/;
const TOKEN = /^[\w-]{1,60}$/;
const RULE = /^[\w-]{1,80}$/;
const CAUSE = /^[\w:.-]{1,120}$/;
const STEP_ID = /^[\w-]{1,100}$/;
const PROJECT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROOT_JSON = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;
const TRANSCRIPT_PATH = new RegExp(`^${READER_TRANSCRIPTS_DIR}/[^/]+\\.json$`);
const RUN_ID = /^\d{1,20}$/;
const AXE_STATUSES = ['new', 'grown', 'improved'];
const SOURCE_OF_NIGHT = Object.freeze({ checks: 'a11y', axe: 'a11y', reader: 'reader' });

/**
 * @typedef {object} Finding
 * @property {'checks'|'axe'|'reader'} source Where it came from.
 * @property {string} check The check id, `axe` for the gating scan, or the reader project (`nvda-chromium`).
 * @property {string} kind The finding kind; `axe-known`, `axe-new`, `axe-grown` or `axe-improved` for the scan;
 * `token-missing` or `golden-differs` for a reader step.
 * @property {string|null} rule The axe rule, when the finding names one.
 * @property {string|null} cause The discovery run's needs-review cause, when the finding names one.
 * @property {string} page The page id, or the reader scenario.
 * @property {string|null} theme The theme; `null` for a reader step.
 * @property {string|null} state The catalog state the target was in.
 * @property {string|null} variant The target's variant (`dark`, `rtl`, a check's own).
 * @property {string} where The masked selector, the step, or both (`selector @ step`).
 * @property {string[]} criteria The WCAG criteria.
 * @property {string|null} severity One of `SEVERITIES`; `null` for a known axe location, whose impact the baseline holds.
 * @property {string} reason One sentence, bounded.
 * @property {string|null} url The fixture path, when the finding names one.
 * @property {string|null} issue The baseline issue a known axe finding is filed under.
 */

/**
 * @typedef {object} Night
 * @property {'a11y'|'reader'} source Which nightly the artifacts are.
 * @property {Finding[]} findings What the night found.
 * @property {{checks: Record<string, string[]>, axe: boolean|null, reader: string[]}} coverage What the night measured:
 * per check the measured targets (`page|theme|variant`), whether the axe scan was complete (`null` without one), and
 * the complete transcripts (`project|scenario`). A row is resolved only inside this coverage.
 * @property {number} problems The tooling problems the night reported.
 * @property {Record<string, {targets: number, measured: number, findings: number, problems: number}>} checks Per check document.
 * @property {{complete: boolean, findings: number, problems: number}|null} axe The scan document.
 * @property {Record<string, Record<string, {steps: string[], failed: string[], golden: string, incomplete: string|null}>>} reader
 * Per project and scenario, the transcript's steps and verdicts.
 */

/**
 * Which family an artifact of the ledger's holds, by its name. The HTML report, the Playwright reports,
 * the recordings and the goldens are named outside it on purpose.
 *
 * @param {string} name The artifact name.
 * @returns {'checks'|'axe'|'reader'|null} The family, or `null` for an unrelated artifact.
 */
export function classifyA11yArtifact(name) {
  if (name === A11Y_EVIDENCE_ARTIFACT) {
    return 'checks';
  }
  if (name === A11Y_AXE_ARTIFACT) {
    return 'axe';
  }
  if (name.startsWith(READER_ARTIFACT_PREFIX)) {
    return 'reader';
  }

  return null;
}

/**
 * Whether a run's accessibility artifacts are recorded: develop, on any event. The nightlies are
 * schedules, a backfill is a dispatch, and a pull request's evidence stays in its own run.
 *
 * @param {{branch: string}} run The run.
 * @returns {boolean} The verdict.
 */
export function isA11yRun(run) {
  return run.branch === 'develop';
}

/**
 * Text cut to a length, with an ellipsis where it was cut.
 *
 * @param {unknown} value The text.
 * @param {number} max The most characters to keep.
 * @returns {string} The text.
 */
function cut(value, max) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();

  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * A fixture path as a finding may carry it: relative to the fixture server, bounded; anything else is dropped.
 *
 * @param {unknown} value The url.
 * @returns {string|null} The path, or `null`.
 */
function fixturePath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && value.length <= LIMITS.url ? value : null;
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

/**
 * Whether a list of criteria names only WCAG 2.2 criteria.
 *
 * @param {unknown} criteria The list.
 * @returns {boolean} The verdict.
 */
function validCriteria(criteria) {
  return Array.isArray(criteria) && criteria.every(id => typeof id === 'string' && Object.hasOwn(WCAG_CRITERIA, id));
}

/**
 * Whether an optional token field (state, variant) is absent or a bounded token.
 *
 * @param {unknown} value The value.
 * @param {RegExp} pattern The token pattern.
 * @returns {boolean} The verdict.
 */
function optionalToken(value, pattern) {
  return value === undefined || value === null || (typeof value === 'string' && pattern.test(value));
}

/**
 * The key that names a target within a check: page, theme and variant (`targetKey` of the evidence module).
 *
 * @param {{page: string, theme: string, variant?: string|null}} target The target or finding.
 * @returns {string} The key.
 */
function targetKey(target) {
  return `${target.page}|${target.theme}|${target.variant ?? ''}`;
}

/**
 * A finding of a check document as the ledger keeps it, or `null` when a field the key or the page reads is
 * not what the evidence shape promises.
 *
 * @param {string} check The check.
 * @param {unknown} item The finding as the document holds it.
 * @returns {Finding|null} The finding.
 */
function checkFinding(check, item) {
  if (!isObject(item) || typeof item.kind !== 'string' || !KEBAB.test(item.kind) || item.kind.length > 60
    || typeof item.page !== 'string' || !PAGE_ID.test(item.page)
    || typeof item.theme !== 'string' || !THEME.test(item.theme)
    || !SEVERITIES.includes(item.severity) || !validCriteria(item.criteria)
    || !optionalToken(item.state, TOKEN) || !optionalToken(item.variant, TOKEN)
    || !optionalToken(item.rule, RULE) || !optionalToken(item.cause, CAUSE)
    || (typeof item.selector !== 'string' && typeof item.step !== 'string')) {
    return null;
  }

  const selector = typeof item.selector === 'string' ? maskSelector(item.selector) : null;
  const step = typeof item.step === 'string' ? cut(item.step, LIMITS.where) : null;
  const where = selector !== null && step !== null ? `${selector} @ ${step}` : (selector ?? step);

  return {
    source: 'checks',
    check,
    kind: item.kind,
    rule: item.rule ?? null,
    cause: item.cause ?? null,
    page: item.page,
    theme: item.theme,
    state: item.state ?? null,
    variant: item.variant ?? null,
    where: cut(where, LIMITS.where),
    criteria: [...item.criteria].sort(compareCriteria),
    severity: item.severity,
    reason: cut(item.reason, LIMITS.reason),
    url: fixturePath(item.url),
    issue: null,
  };
}

/**
 * Reads one check document into the night.
 *
 * @param {{artifact: string, path: string, text: string}} file The file.
 * @param {string} label The file, for a note.
 * @param {Night} night The a11y night.
 * @param {string[]} notes Where a note goes.
 */
function readEvidence(file, label, night, notes) {
  const check = ROOT_JSON.exec(file.path)[1];

  if (!Object.hasOwn(EVIDENCE_CHECKS, check)) {
    notes.push(`${label}: ${check} is not a check of EVIDENCE_CHECKS (tests/lib/a11y-evidence.mjs), skipped`);

    return;
  }

  const doc = parse(file, label, notes);

  if (doc === null) {
    return;
  }
  if (doc.schema !== EVIDENCE_SCHEMA) {
    notes.push(`${label}: schema ${JSON.stringify(doc.schema)} is not ${EVIDENCE_SCHEMA}, skipped`);

    return;
  }
  if (doc.check !== check) {
    notes.push(`${label}: the document names check ${cut(doc.check, 60)}; skipped`);

    return;
  }
  if (!Array.isArray(doc.targets) || !Array.isArray(doc.findings)) {
    notes.push(`${label}: no targets or findings list, skipped`);

    return;
  }
  if (Object.hasOwn(night.checks, check)) {
    notes.push(`${label}: a second document for ${check}, skipped`);

    return;
  }

  const measured = doc.targets.filter(target => isObject(target) && target.status === 'measured'
    && typeof target.page === 'string' && PAGE_ID.test(target.page) && typeof target.theme === 'string' && THEME.test(target.theme)
    && optionalToken(target.variant, TOKEN));
  const findings = doc.findings.length > LIMITS.findings ? doc.findings.slice(0, LIMITS.findings) : doc.findings;
  const kept = [];
  let malformed = 0;

  if (doc.findings.length > LIMITS.findings) {
    notes.push(`${label}: ${doc.findings.length} findings, only the first ${LIMITS.findings} read`);
  }
  for (const item of findings) {
    const finding = checkFinding(check, item);

    if (finding === null) {
      malformed += 1;
    } else {
      kept.push(finding);
    }
  }
  if (malformed > 0) {
    notes.push(`${label}: ${malformed} malformed finding(s) dropped`);
  }

  const problems = Array.isArray(doc.problems) ? doc.problems.length : 0;

  night.findings.push(...kept);
  night.coverage.checks[check] = [...new Set(measured.map(targetKey))].sort();
  night.checks[check] = { targets: doc.targets.length, measured: measured.length, findings: kept.length, problems };
  night.problems += problems;
}

/**
 * Reads the axe scan's findings document into the night.
 *
 * @param {{artifact: string, path: string, text: string}} file The file.
 * @param {string} label The file, for a note.
 * @param {Night} night The a11y night.
 * @param {string[]} notes Where a note goes.
 */
function readAxe(file, label, night, notes) {
  const doc = parse(file, label, notes);

  if (doc === null) {
    return;
  }
  if (doc.schema !== A11Y_AXE_SCHEMA) {
    notes.push(`${label}: schema ${JSON.stringify(doc.schema)} is not ${A11Y_AXE_SCHEMA}, skipped`);

    return;
  }
  if (!Array.isArray(doc.issues) || !Array.isArray(doc.needsAction) || !isObject(doc.counts)) {
    notes.push(`${label}: no issues, needsAction or counts, skipped`);

    return;
  }
  if (night.axe !== null) {
    notes.push(`${label}: a second findings document, skipped`);

    return;
  }

  const kept = [];
  let malformed = 0;
  const location = (item, fields) => {
    if (!isObject(item) || typeof item.page !== 'string' || !PAGE_ID.test(item.page) || typeof item.theme !== 'string'
      || !THEME.test(item.theme) || typeof item.rule !== 'string' || !RULE.test(item.rule) || typeof item.target !== 'string') {
      malformed += 1;

      return;
    }
    kept.push({
      source: 'axe',
      check: 'axe',
      rule: item.rule,
      cause: null,
      page: item.page,
      theme: item.theme,
      state: null,
      variant: null,
      where: cut(maskSelector(item.target), LIMITS.where),
      ...fields,
    });
  };

  for (const issue of doc.issues.slice(0, LIMITS.issues)) {
    if (!isObject(issue) || typeof issue.id !== 'string' || !KEBAB.test(issue.id) || !validCriteria(issue.wcag) || !Array.isArray(issue.locations)) {
      malformed += 1;
      continue;
    }
    for (const item of issue.locations.slice(0, LIMITS.locations)) {
      location(item, {
        kind: 'axe-known',
        criteria: [...issue.wcag].sort(compareCriteria),
        severity: null,
        reason: cut(issue.title, LIMITS.reason),
        url: null,
        issue: issue.id,
      });
    }
  }
  for (const item of doc.needsAction.slice(0, LIMITS.locations)) {
    if (!isObject(item) || !AXE_STATUSES.includes(item.status)) {
      // A `fixed` entry is a baseline entry that no longer reproduces: not a finding to keep.
      if (!isObject(item) || item.status !== 'fixed') {
        malformed += 1;
      }
      continue;
    }
    if (!validCriteria(item.wcag) || !optionalToken(item.issue, KEBAB)) {
      malformed += 1;
      continue;
    }
    location(item, {
      kind: `axe-${item.status}`,
      criteria: [...item.wcag].sort(compareCriteria),
      severity: SEVERITIES.includes(item.impact) ? item.impact : null,
      reason: cut(item.help ?? item.rule, LIMITS.reason),
      url: fixturePath(item.url),
      issue: item.issue ?? null,
    });
  }
  if (malformed > 0) {
    notes.push(`${label}: ${malformed} malformed finding(s) dropped`);
  }

  const problems = Array.isArray(doc.problems) ? doc.problems.length : 0;
  const complete = problems === 0 && doc.counts.unverified === 0;

  night.findings.push(...kept);
  night.coverage.axe = complete;
  night.axe = { complete, findings: kept.length, problems };
  night.problems += problems;
}

/**
 * Reads one transcript into the reader night.
 *
 * @param {{artifact: string, path: string, text: string}} file The file.
 * @param {string} label The file, for a note.
 * @param {Night} night The reader night.
 * @param {string[]} notes Where a note goes.
 */
function readTranscript(file, label, night, notes) {
  const project = file.artifact.slice(READER_ARTIFACT_PREFIX.length);

  if (!PROJECT.test(project) || project.length > 40) {
    notes.push(`${file.artifact}: not a project name, skipped`);

    return;
  }

  const doc = parse(file, label, notes);

  if (doc === null) {
    return;
  }
  if (doc.schema !== READER_TRANSCRIPT_SCHEMA) {
    notes.push(`${label}: schema ${JSON.stringify(doc.schema)} is not ${READER_TRANSCRIPT_SCHEMA}, skipped`);

    return;
  }
  if (doc.project !== project) {
    notes.push(`${label}: the transcript names project ${cut(doc.project, 60)}; skipped`);

    return;
  }
  if (typeof doc.scenario !== 'string' || !KEBAB.test(doc.scenario) || doc.scenario.length > 60 || !Array.isArray(doc.steps)) {
    notes.push(`${label}: no scenario id or steps list, skipped`);

    return;
  }
  if (night.reader[project]?.[doc.scenario]) {
    notes.push(`${label}: a second transcript of ${doc.scenario} on ${project}, skipped`);

    return;
  }

  const scenario = doc.scenario;
  const stepList = doc.steps.length > LIMITS.steps ? doc.steps.slice(0, LIMITS.steps) : doc.steps;
  const steps = [];
  const failed = [];
  let malformed = 0;
  const reader = (kind, step, severity, reason) => ({
    source: 'reader',
    check: project,
    kind,
    rule: null,
    cause: null,
    page: scenario,
    theme: null,
    state: null,
    variant: null,
    where: step,
    criteria: [],
    severity,
    reason: cut(reason, LIMITS.reason),
    url: null,
    issue: null,
  });

  if (doc.steps.length > LIMITS.steps) {
    notes.push(`${label}: ${doc.steps.length} steps, only the first ${LIMITS.steps} read`);
  }
  for (const step of stepList) {
    if (!isObject(step) || typeof step.id !== 'string' || !STEP_ID.test(step.id) || !isObject(step.tokens)
      || typeof step.tokens.passed !== 'boolean' || !Array.isArray(step.tokens.groups) || steps.includes(step.id)) {
      malformed += 1;
      continue;
    }
    steps.push(step.id);

    if (!step.tokens.passed) {
      const missing = step.tokens.groups
        .filter(group => isObject(group) && group.matched === null && Array.isArray(group.synonyms))
        .map(group => group.synonyms.map(synonym => cut(synonym, 60)).join(' | '));

      failed.push(step.id);
      night.findings.push(reader('token-missing', step.id, 'serious', `the announcement lacks: ${missing.join(', ')}`));
    }
  }
  if (malformed > 0) {
    notes.push(`${label}: ${malformed} malformed step(s) dropped`);
  }

  const golden = isObject(doc.golden) && typeof doc.golden.status === 'string' ? cut(doc.golden.status, 20) : 'missing';
  const differences = Array.isArray(doc.golden?.differences) ? doc.golden.differences.slice(0, LIMITS.steps) : [];

  for (const difference of differences) {
    // A recorded step the scenario no longer has (`actual: null`) is the golden's to update, not a finding.
    if (!isObject(difference) || typeof difference.id !== 'string' || !STEP_ID.test(difference.id) || difference.actual === null) {
      continue;
    }

    const heard = `heard ${JSON.stringify(cut(difference.actual, 100))}`;

    night.findings.push(reader('golden-differs', difference.id, 'advisory', difference.expected === null || difference.expected === undefined
      ? `no golden for this step, ${heard}`
      : `expected ${JSON.stringify(cut(difference.expected, 100))}, ${heard}`));
  }

  const incomplete = isObject(doc.incomplete) && typeof doc.incomplete.step === 'string' ? cut(doc.incomplete.step, 100) : null;

  if (incomplete === null) {
    night.coverage.reader.push(`${project}|${scenario}`);
    night.coverage.reader.sort();
  } else {
    night.problems += 1;
  }
  night.reader[project] = night.reader[project] ?? {};
  night.reader[project][scenario] = { steps, failed, golden, incomplete };
}

/**
 * One artifact file parsed as JSON, or `null` with a note.
 *
 * @param {{text: string}} file The file.
 * @param {string} label The file, for a note.
 * @param {string[]} notes Where a note goes.
 * @returns {object|null} The document.
 */
function parse(file, label, notes) {
  const bytes = Buffer.byteLength(file.text);

  if (bytes > A11Y_FILE_CAP_BYTES) {
    notes.push(`${label}: ${bytes} bytes, over the ${A11Y_FILE_CAP_BYTES}-byte cap, skipped`);

    return null;
  }

  try {
    const doc = JSON.parse(file.text);

    if (!isObject(doc)) {
      notes.push(`${label}: not a JSON object, skipped`);

      return null;
    }

    return doc;
  } catch (error) {
    notes.push(`${label}: could not be read (${error.message}), skipped`);

    return null;
  }
}

/**
 * An empty night of a source.
 *
 * @param {'a11y'|'reader'} source The source.
 * @returns {Night} The night.
 */
function emptyNight(source) {
  return { source, findings: [], coverage: { checks: {}, axe: null, reader: [] }, problems: 0, checks: {}, axe: null, reader: {} };
}

/**
 * The nights a run's accessibility artifacts hold: the a11y night (the check documents at the evidence
 * artifact's root and the findings at the axe artifact's root) and the reader night (the transcripts of
 * every `screenreader-transcripts-<project>` artifact). Everything else in those artifacts (the per-test
 * folders, the detail files, the comparison, the scans, the logs) is ignored. A file that does not parse,
 * does not validate or is over the cap is skipped with a note, and the rest of the night is read.
 *
 * @param {Array<{artifact: string, path: string, text: string}>} files The run's files of the family
 * (`collectArtifactFiles().a11y`).
 * @returns {{nights: Night[], notes: string[]}} The nights with at least one artifact seen, and the notes.
 */
export function readA11yArtifacts(files) {
  const notes = [];
  const a11y = emptyNight('a11y');
  const reader = emptyNight('reader');
  let sawA11y = false;
  let sawReader = false;

  for (const file of files) {
    const family = classifyA11yArtifact(file.artifact);
    const label = `${file.artifact}/${file.path}`;

    if (family === 'checks' && ROOT_JSON.test(file.path)) {
      sawA11y = true;
      readEvidence(file, label, a11y, notes);
    } else if (family === 'axe' && file.path === A11Y_AXE_FILE) {
      sawA11y = true;
      readAxe(file, label, a11y, notes);
    } else if (family === 'reader' && TRANSCRIPT_PATH.test(file.path)) {
      sawReader = true;
      readTranscript(file, label, reader, notes);
    }
  }

  return { nights: [...(sawA11y ? [a11y] : []), ...(sawReader ? [reader] : [])], notes };
}

/**
 * What identifies a finding across nights: its source, check and kind, the axe rule and cause it names,
 * its target (page, theme, state, variant) and the masked selector or step. Never the reason, the
 * severity or the criteria, which a check may reword.
 *
 * @param {Finding} finding The finding or row.
 * @returns {string} The key.
 */
export function findingKey(finding) {
  return [finding.source, finding.check, finding.kind, finding.rule ?? '', finding.cause ?? '', finding.page, finding.theme ?? '',
    finding.state ?? '', finding.variant ?? '', finding.where].join('|');
}

/**
 * The empty ledger.
 *
 * @param {object} [options] Options.
 * @param {number} [options.retentionDays] Override of `A11Y_RETENTION_DAYS`.
 * @param {number} [options.capBytes] Override of `A11Y_CAP_BYTES`.
 * @returns {object} The ledger.
 */
export function emptyA11yLedger({ retentionDays = A11Y_RETENTION_DAYS, capBytes = A11Y_CAP_BYTES } = {}) {
  return {
    version: A11Y_VERSION,
    updatedAt: null,
    retentionDays,
    capBytes,
    trendNights: A11Y_TREND_NIGHTS,
    flapNights: A11Y_FLAP_NIGHTS,
    latest: { a11y: null, reader: null },
    nights: [],
    rows: [],
  };
}

/**
 * Throws unless a stored ledger is absent or of this code's version, older or newer alike: a version bump
 * ships its own migration, and reverting the collector after one must not drop the history either.
 *
 * @param {object|null} doc The ledger as read from `gh-pages`, or `null`.
 */
export function assertA11yVersion(doc) {
  if (doc !== null && doc?.version !== A11Y_VERSION) {
    throw new Error(`a11y.json has version ${doc?.version}, and this collector reads and writes version ${A11Y_VERSION}; `
      + 'a version bump ships its own migration instead of rebuilding the history');
  }
}

/**
 * Which night source a row belongs to.
 *
 * @param {{source: string}} row The row or finding.
 * @returns {'a11y'|'reader'} The source.
 */
function nightSourceOf(row) {
  return SOURCE_OF_NIGHT[row.source];
}

/**
 * Whether a night measured a row's target, so that the row's absence means the finding is gone.
 *
 * @param {object} row The row.
 * @param {Night['coverage']} coverage The night's coverage.
 * @returns {boolean} The verdict.
 */
function covered(row, coverage) {
  if (row.source === 'checks') {
    return (coverage.checks[row.check] ?? []).includes(targetKey(row));
  }
  if (row.source === 'axe') {
    return coverage.axe === true;
  }

  return coverage.reader.includes(`${row.check}|${row.page}`);
}

/**
 * The status of a row seen tonight.
 *
 * @param {object} row The row, updated for the sighting.
 * @returns {'new'|'persisting'|'flapping'} The status.
 */
function seenStatus(row) {
  if (row.nightsSeen === 1) {
    return 'new';
  }

  return row.gaps > 0 && row.seenSinceGap <= A11Y_FLAP_NIGHTS ? 'flapping' : 'persisting';
}

/**
 * Rows in the order the file keeps them: by key.
 *
 * @param {object[]} rows The rows.
 * @returns {object[]} The rows, sorted.
 */
function sortRows(rows) {
  return [...rows].sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Nights newest first.
 *
 * @param {object[]} nights The nights.
 * @returns {object[]} The nights, sorted.
 */
function sortNights(nights) {
  return [...nights].sort((a, b) => Date.parse(b.seenAt) - Date.parse(a.seenAt) || b.runId.localeCompare(a.runId, 'en', { numeric: true }));
}

/**
 * The stored ledger as text: one night per line and one row per line, so a diff of the `gh-pages` commit
 * shows which rows moved. Valid JSON that `JSON.parse` reads back as the same document.
 *
 * @param {object} doc The ledger.
 * @returns {string} The text.
 */
export function serializeA11yLedger(doc) {
  const { nights, rows, ...head } = doc;
  const nightLines = nights.map(night => JSON.stringify(night));
  const rowLines = rows.map(row => JSON.stringify(row));

  return `${JSON.stringify(head).slice(0, -1)},\n"nights":[\n${nightLines.join(',\n')}\n],\n"rows":[\n${rowLines.join(',\n')}\n]}\n`;
}

/**
 * The document assembled from its parts, with its text size.
 *
 * @param {object} head The head fields.
 * @param {object[]} nights The nights, newest first.
 * @param {object[]} rows The rows, by key.
 * @returns {{doc: object, size: number}} The document and its serialized size in bytes.
 */
function assemble(head, nights, rows) {
  const doc = { ...head, nights, rows };

  return { doc, size: Buffer.byteLength(serializeA11yLedger(doc)) };
}

/**
 * Merges one night into the ledger.
 *
 * - Every finding of the night becomes a row, or updates its row: `lastSeen`, `nightsSeen`, the latest
 *   severity, criteria, reason and url. A row seen for the first time is `new`; one seen again is
 *   `persisting`, or `flapping` when it came back after being resolved and has not yet been seen
 *   `A11Y_FLAP_NIGHTS` nights in a row since.
 * - A row of the night's source that the night did not find is `resolved` when the night measured its
 *   target (`coverage`), and left as it was otherwise.
 * - Every row is then sorted into its cluster by the catalog, so an edit to the catalog re-sorts the whole
 *   ledger on the next night; an ambiguous finding goes to the first cluster, with a note.
 * - The night is recorded with its counts, per cluster, for the trend. A run already recorded, a run older
 *   than the latest night of its source, or a night with no readable document changes nothing.
 * - Rows past the retention window (from their last sighting) and nights past it go; past the cap, the
 *   oldest resolved rows go first, then the oldest nights.
 *
 * @param {object|null} previous The ledger as read from `gh-pages`, or `null`.
 * @param {Night} night The night (`readA11yArtifacts`).
 * @param {import('./test-health.mjs').RunContext} run The collected run.
 * @param {object} catalog The compiled cluster catalog (`compileIssuesCatalog`).
 * @param {object} options Options.
 * @param {Date} options.now The current time.
 * @param {number} [options.retentionDays] Override of `A11Y_RETENTION_DAYS`.
 * @param {number} [options.capBytes] Override of `A11Y_CAP_BYTES`.
 * @returns {{doc: object, changed: boolean, notes: string[], recorded: object|null}} The ledger, whether its text
 * changed, the notes, and what the night recorded (`null` when nothing was).
 */
export function mergeA11yLedger(previous, night, run, catalog, { now, retentionDays = A11Y_RETENTION_DAYS, capBytes = A11Y_CAP_BYTES }) {
  assertA11yVersion(previous ?? null);

  if (!RUN_ID.test(String(run.runId))) {
    throw new Error(`run id ${JSON.stringify(run.runId)} is not a run id`);
  }

  const seenAt = Date.parse(run.seenAt);

  if (Number.isNaN(seenAt)) {
    throw new Error(`run ${run.runId} has no completion time (${JSON.stringify(run.seenAt)})`);
  }

  const prior = previous ?? emptyA11yLedger({ retentionDays, capBytes });
  const notes = [];
  const unchanged = () => ({ doc: prior, changed: false, notes, recorded: null });
  const { source } = night;
  const where = `run ${run.runId} (${source})`;
  const readable = night.findings.length > 0 || Object.keys(night.coverage.checks).length > 0 || night.coverage.axe !== null
    || night.coverage.reader.length > 0;

  if (!readable) {
    notes.push(`${where}: no readable accessibility document, nothing recorded`);

    return unchanged();
  }
  if (prior.nights.some(entry => entry.runId === run.runId)) {
    notes.push(`${where} is already recorded; a run is read once, nothing recorded`);

    return unchanged();
  }

  const latest = prior.latest?.[source] ?? null;

  if (latest && seenAt < Date.parse(latest.seenAt)) {
    notes.push(`${where} completed ${run.seenAt}, before the latest ${source} night ${latest.runId} (${latest.seenAt}); `
      + 'nights are recorded in order, nothing recorded');

    return unchanged();
  }

  // The run's completion time as the API gives it, like the flake ledger's `seenAt`: never re-serialized, so a
  // re-collection compares equal.
  const at = run.seenAt;
  const rows = new Map(prior.rows.map(row => [row.key, { ...row }]));
  const seen = new Set();
  const resolvedNow = new Set();

  for (const finding of night.findings) {
    const key = findingKey(finding);

    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const latestFields = { criteria: finding.criteria, severity: finding.severity, reason: finding.reason, url: finding.url, issue: finding.issue };
    const row = rows.get(key);

    if (row === undefined) {
      rows.set(key, {
        key,
        source: finding.source,
        check: finding.check,
        kind: finding.kind,
        rule: finding.rule,
        cause: finding.cause,
        page: finding.page,
        theme: finding.theme,
        state: finding.state,
        variant: finding.variant,
        where: finding.where,
        ...latestFields,
        firstSeen: at,
        lastSeen: at,
        firstRun: run.runId,
        lastRun: run.runId,
        nightsSeen: 1,
        gaps: 0,
        seenSinceGap: 1,
        resolvedAt: null,
        status: 'new',
        cluster: null,
        tracker: null,
      });
      continue;
    }

    // A resolved row's `seenSinceGap` is 0 (the resolution set it), so the count restarts at 1 on its comeback.
    Object.assign(row, latestFields, {
      lastSeen: at,
      lastRun: run.runId,
      nightsSeen: row.nightsSeen + 1,
      seenSinceGap: row.seenSinceGap + 1,
      resolvedAt: null,
    });
    row.status = seenStatus(row);
  }

  for (const row of rows.values()) {
    if (nightSourceOf(row) !== source || seen.has(row.key) || row.status === 'resolved' || !covered(row, night.coverage)) {
      continue;
    }
    row.status = 'resolved';
    row.resolvedAt = at;
    row.gaps += 1;
    row.seenSinceGap = 0;
    resolvedNow.add(row.key);
  }

  const clusters = {};
  const bump = (id, field) => {
    clusters[id] = clusters[id] ?? { seen: 0, new: 0, resolved: 0 };
    clusters[id][field] += 1;
  };
  const counts = { findings: seen.size, new: 0, resolved: resolvedNow.size, flapping: 0, triage: 0 };

  for (const row of rows.values()) {
    const verdict = clusterOf(row, catalog);

    row.cluster = verdict.id;
    row.tracker = verdict.tracker;

    if (verdict.ambiguous.length > 0) {
      notes.push(`${row.key}: matches ${verdict.ambiguous.length} clusters (${verdict.ambiguous.join(', ')}); sorted to ${verdict.id}; `
        + 'tests/a11y/issues.json needs one rule per finding');
    }
    if (seen.has(row.key)) {
      bump(row.cluster, 'seen');

      if (row.status === 'new') {
        bump(row.cluster, 'new');
        counts.new += 1;
      }
      if (row.status === 'flapping') {
        counts.flapping += 1;
      }
      if (row.cluster === TRIAGE_ID) {
        counts.triage += 1;
      }
    }
    if (resolvedNow.has(row.key)) {
      bump(row.cluster, 'resolved');
    }
  }

  const record = {
    runId: run.runId,
    runAttempt: run.runAttempt,
    source,
    workflow: run.workflow,
    event: run.event,
    branch: run.branch,
    headSha: run.headSha,
    seenAt: at,
    ...counts,
    problems: night.problems,
    clusters: Object.fromEntries(Object.keys(clusters).sort().map(id => [id, clusters[id]])),
    ...(source === 'a11y' ? { checks: night.checks, axe: night.axe } : { reader: night.reader }),
  };

  // Retention: from a row's last sighting, and a night's completion.
  const cutoff = now.getTime() - (retentionDays * DAY_MS);
  const keptRows = [...rows.values()].filter(row => Date.parse(row.lastSeen) >= cutoff);
  const droppedRows = rows.size - keptRows.length;
  const allNights = sortNights([...prior.nights, record]);
  const keptNights = allNights.filter(entry => Date.parse(entry.seenAt) >= cutoff);

  if (droppedRows > 0) {
    notes.push(`${droppedRows} row(s) older than ${retentionDays} days dropped`);
  }

  const head = {
    version: A11Y_VERSION,
    // Sized with a timestamp in place: the final value is `now` or the prior stamp, both of this length.
    updatedAt: now.toISOString(),
    retentionDays,
    capBytes,
    trendNights: A11Y_TREND_NIGHTS,
    flapNights: A11Y_FLAP_NIGHTS,
    latest: { ...prior.latest, [source]: { runId: run.runId, seenAt: at } },
  };
  let currentRows = sortRows(keptRows);
  let currentNights = keptNights;
  let { doc, size } = assemble(head, currentNights, currentRows);
  let shedRows = 0;
  let shedNights = 0;

  // The cap: the oldest resolved rows first, in rounds measured against the serialized text.
  while (size > capBytes && currentRows.some(row => row.status === 'resolved')) {
    const resolved = currentRows.filter(row => row.status === 'resolved')
      .sort((a, b) => Date.parse(a.resolvedAt) - Date.parse(b.resolvedAt) || a.key.localeCompare(b.key));
    const victims = new Set();
    let freed = 0;

    for (const row of resolved) {
      if (freed >= size - capBytes) {
        break;
      }
      victims.add(row.key);
      freed += Buffer.byteLength(JSON.stringify(row)) + 2;
    }
    currentRows = currentRows.filter(row => !victims.has(row.key));
    shedRows += victims.size;
    ({ doc, size } = assemble(head, currentNights, currentRows));
  }
  while (size > capBytes && currentNights.length > 1) {
    currentNights = currentNights.slice(0, -1);
    shedNights += 1;
    ({ doc, size } = assemble(head, currentNights, currentRows));
  }
  if (shedRows > 0) {
    notes.push(`a11y.json: dropped ${shedRows} resolved row(s) to stay under ${capBytes} bytes`);
  }
  if (shedNights > 0) {
    notes.push(`a11y.json: dropped the ${shedNights} oldest night(s) to stay under ${capBytes} bytes`);
  }
  if (size > capBytes) {
    notes.push(`a11y.json: ${size} bytes even without resolved rows and older nights, over the ${capBytes}-byte cap`);
  }

  // A merge that reaches here added a night record, so the text always changed; the no-ops (a run already
  // recorded, one out of order, one with nothing readable) returned the prior document above, stamp included.
  const changed = true;

  doc.updatedAt = now.toISOString();

  const recorded = {
    source,
    runId: run.runId,
    ...counts,
    clusters: Object.entries(clusters).map(([id, entry]) => [id, entry.seen])
      .sort((a, b) => Number(a[0] === TRIAGE_ID) - Number(b[0] === TRIAGE_ID) || b[1] - a[1] || a[0].localeCompare(b[0])),
  };

  return { doc, changed, notes, recorded };
}

/**
 * Items counted by a key, most first, then by key.
 *
 * @param {object[]} items The items.
 * @param {Function} keyOf The key of an item.
 * @returns {Array<[string, number]>} The pairs.
 */
function countBy(items, keyOf) {
  const counts = new Map();

  for (const item of items) {
    const key = keyOf(item);

    if (key !== null && key !== undefined) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * The worst of two severities.
 *
 * @param {string|null} a One.
 * @param {string|null} b The other.
 * @returns {string|null} The worse.
 */
function worse(a, b) {
  if (a === null) {
    return b;
  }
  if (b === null) {
    return a;
  }

  return SEVERITIES.indexOf(a) <= SEVERITIES.indexOf(b) ? a : b;
}

/**
 * What the page inlines: the clusters with their counts and trend, the criteria, the latest reader
 * verdicts, the triage queue and the nights, all derived from the ledger so the page needs no fetch. No
 * task id is in it: the page says whether a cluster has a tracker, never which.
 *
 * @param {object|null} doc The ledger.
 * @param {object} catalog The compiled cluster catalog.
 * @returns {object|null} The view, or `null` before any night was recorded.
 */
export function a11yView(doc, catalog) {
  if (!doc || !Array.isArray(doc.nights) || doc.nights.length === 0) {
    return null;
  }

  const rows = doc.rows ?? [];
  const open = rows.filter(row => row.status !== 'resolved');
  const nightsBySource = ['a11y', 'reader'].flatMap(source => sortNights(doc.nights.filter(night => night.source === source))
    .slice(0, A11Y_TREND_NIGHTS));
  const nights = nightsBySource.sort((a, b) => Date.parse(a.seenAt) - Date.parse(b.seenAt) || a.runId.localeCompare(b.runId, 'en', { numeric: true }));
  const nightOf = source => sortNights(doc.nights.filter(night => night.source === source))[0] ?? null;
  const latestOf = (source) => {
    const night = nightOf(source);

    return night ? { runId: night.runId, runAttempt: night.runAttempt, seenAt: night.seenAt, headSha: String(night.headSha ?? '').slice(0, 10),
      workflow: night.workflow } : null;
  };
  const titles = new Map(catalog.clusters.map(cluster => [cluster.id, cluster]));
  const clusterIds = [...new Set([...catalog.clusters.map(cluster => cluster.id), ...rows.map(row => row.cluster)])]
    .filter(id => id !== TRIAGE_ID);
  const clusterView = (id) => {
    const own = rows.filter(row => row.cluster === id);
    const ownOpen = own.filter(row => row.status !== 'resolved');
    const byStatus = status => own.filter(row => row.status === status).length;
    const entry = titles.get(id);

    return {
      id,
      title: id === TRIAGE_ID ? 'Needs triage' : (entry?.title ?? id),
      tracked: Boolean(entry?.tracker),
      triage: id === TRIAGE_ID,
      open: ownOpen.length,
      new: byStatus('new'),
      persisting: byStatus('persisting'),
      flapping: byStatus('flapping'),
      resolved: byStatus('resolved'),
      nightsSeen: doc.nights.filter(night => (night.clusters?.[id]?.seen ?? 0) > 0).length,
      lastSeen: own.reduce((last, row) => (last === null || Date.parse(row.lastSeen) > Date.parse(last) ? row.lastSeen : last), null),
      severities: Object.fromEntries(countBy(ownOpen, row => row.severity)),
      criteria: countBy(ownOpen.flatMap(row => row.criteria), id2 => id2).sort((a, b) => compareCriteria(a[0], b[0])),
      sources: countBy(ownOpen, row => row.source),
      kinds: countBy(ownOpen, row => row.kind).slice(0, 8),
      pages: countBy(ownOpen, row => row.page).slice(0, 5),
      // [night index, seen, new, resolved] for every night of the trend.
      trend: nights.map((night, index) => {
        const counts = night.clusters?.[id] ?? { seen: 0, new: 0, resolved: 0 };

        return [index, counts.seen, counts.new, counts.resolved];
      }),
    };
  };
  const clusters = [...clusterIds.map(clusterView), clusterView(TRIAGE_ID)]
    .sort((a, b) => Number(a.triage) - Number(b.triage) || b.open - a.open || a.id.localeCompare(b.id));
  const criteria = [...new Set(open.flatMap(row => row.criteria))].sort(compareCriteria).map(id => ({
    id,
    name: WCAG_CRITERIA[id]?.name ?? null,
    level: WCAG_CRITERIA[id]?.level ?? null,
    open: open.filter(row => row.criteria.includes(id)).length,
    clusters: [...new Set(open.filter(row => row.criteria.includes(id)).map(row => row.cluster))].sort(),
  }));
  const latestA11y = nightOf('a11y');
  const checks = latestA11y
    ? [
      ...(latestA11y.axe ? [{ check: 'axe', title: 'axe scan', targets: null, measured: null, findings: latestA11y.axe.findings,
        problems: latestA11y.axe.problems }] : []),
      ...Object.keys(latestA11y.checks ?? {}).sort().map(check => ({
        check,
        title: EVIDENCE_CHECKS[check]?.title ?? check,
        ...latestA11y.checks[check],
      })),
    ]
    : [];
  const latestReader = nightOf('reader');
  const reader = { projects: [], scenarios: [] };

  if (latestReader) {
    const goldenRows = new Set(rows.filter(row => row.source === 'reader' && row.kind === 'golden-differs' && row.lastRun === latestReader.runId)
      .map(row => `${row.check}|${row.page}|${row.where}`));

    reader.projects = Object.keys(latestReader.reader ?? {}).sort();

    const scenarioIds = [...new Set(reader.projects.flatMap(project => Object.keys(latestReader.reader[project])))].sort();

    reader.scenarios = scenarioIds.map((scenario) => {
      const steps = [];
      const verdicts = {};
      const golden = {};
      const incomplete = {};

      for (const project of reader.projects) {
        const transcript = latestReader.reader[project][scenario];

        if (!transcript) {
          continue;
        }
        for (const step of transcript.steps) {
          if (!steps.includes(step)) {
            steps.push(step);
          }
        }
        verdicts[project] = Object.fromEntries(transcript.steps.map(step => [step, transcript.failed.includes(step)
          ? 'fail'
          : (goldenRows.has(`${project}|${scenario}|${step}`) ? 'golden' : 'pass')]));
        golden[project] = transcript.golden;

        if (transcript.incomplete) {
          incomplete[project] = transcript.incomplete;
        }
      }

      return { scenario, steps, verdicts, golden, incomplete };
    });
  }

  const triageRows = open.filter(row => row.cluster === TRIAGE_ID);
  const shapes = new Map();

  for (const row of sortRows(triageRows)) {
    const key = [row.source, row.check, row.kind, row.rule ?? '', row.cause ?? '', row.where].join('|');
    const shape = shapes.get(key) ?? { source: row.source, check: row.check, kind: row.kind, rule: row.rule, cause: row.cause, where: row.where,
      severity: null, criteria: new Set(), reason: row.reason, pages: new Set(), examplePage: row.page, nightsSeen: 0, statuses: new Set() };

    shape.severity = worse(shape.severity, row.severity);
    row.criteria.forEach(id => shape.criteria.add(id));
    shape.pages.add(row.page);
    shape.nightsSeen = Math.max(shape.nightsSeen, row.nightsSeen);
    shape.statuses.add(row.status);
    shapes.set(key, shape);
  }

  const triageShapes = [...shapes.values()].map(shape => ({
    ...shape,
    criteria: [...shape.criteria].sort(compareCriteria),
    pages: shape.pages.size,
    status: shape.statuses.has('flapping') ? 'flapping' : (shape.statuses.has('persisting') ? 'persisting' : 'new'),
    statuses: undefined,
  })).map(({ statuses, ...shape }) => shape)
    .sort((a, b) => b.pages - a.pages
      || SEVERITIES.indexOf(a.severity ?? 'advisory') - SEVERITIES.indexOf(b.severity ?? 'advisory')
      || `${a.check}|${a.kind}|${a.where}`.localeCompare(`${b.check}|${b.kind}|${b.where}`));

  return {
    updatedAt: doc.updatedAt,
    retentionDays: doc.retentionDays,
    trendNights: doc.trendNights ?? A11Y_TREND_NIGHTS,
    flapNights: doc.flapNights ?? A11Y_FLAP_NIGHTS,
    latest: { a11y: latestOf('a11y'), reader: latestOf('reader') },
    totals: {
      open: open.length,
      new: open.filter(row => row.status === 'new').length,
      persisting: open.filter(row => row.status === 'persisting').length,
      flapping: open.filter(row => row.status === 'flapping').length,
      resolved: rows.length - open.length,
      triage: triageRows.length,
      clusters: catalog.clusters.length,
      nights: doc.nights.length,
    },
    // [run id, seen at, source, findings, new, resolved, need triage, problems], oldest first.
    nights: nights.map(night => [night.runId, night.seenAt, night.source, night.findings, night.new, night.resolved, night.triage, night.problems]),
    clusters,
    criteria,
    checks,
    reader,
    triage: { total: triageRows.length, shapes: triageShapes.length, rows: triageShapes.slice(0, A11Y_TRIAGE_SHOWN) },
  };
}

/**
 * The step summary's line about the accessibility nights a run recorded, empty when it recorded none.
 *
 * @param {object[]} recorded What `mergeA11yLedger` recorded, one entry per night.
 * @returns {string} One Markdown line.
 */
export function renderA11yLine(recorded) {
  return recorded.filter(Boolean).map(entry => `Accessibility: ${entry.source} night ${entry.runId} recorded ${entry.findings} findings `
    + `(${entry.new} new, ${entry.resolved} resolved, ${entry.flapping} flapping, ${entry.triage} need triage)`
    + (entry.clusters.length > 0 ? `; clusters: ${entry.clusters.map(([id, seen]) => `${id} ${seen}`).join(', ')}.` : '.')).join(' ');
}
