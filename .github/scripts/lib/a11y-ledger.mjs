/**
 * The accessibility findings ledger: the pure half.
 *
 * Every audit (a dispatch of the `A11y nightly` on develop) leaves one evidence document per check beyond axe
 * (`a11y-checks-evidence`, `tests/lib/a11y-evidence.mjs`) and the axe scan's findings
 * (`a11y-axe-results`, `tests/lib/a11y-findings.mjs`), and the `Screen reader nightly` leaves one
 * transcript per scenario and project (`screenreader-transcripts-<project>-<group>`,
 * `tests/lib/screenreader-transcript.mjs`). A dispatch of `Docs a11y` leaves the docs site scan's findings in
 * the same shape as the axe scan's (`docs-a11y-axe-results`, `tests/a11y/docs/`), a night of a third source, and the
 * documents of the docs site checks beyond axe (`docs-a11y-checks-evidence`, `tests/a11y/sites/`) in the product
 * checks' shape, in the same night under the row source `docs-checks`.
 * A raw night holds thousands of records, most of them the
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
 * - Only the two nightlies and the docs site scan, run on develop by their schedule or a dispatch (`isA11yRun`). A pull request's
 *   evidence, a fork's included, is produced by the pull request's own code, and a fork can name its branch
 *   `develop`: the branch alone is not enough. A night's source is its workflow's.
 * - A night is read once per attempt, in order: a run already recorded at that attempt, or one that completed
 *   before the latest night of its source, changes nothing. A later attempt of the latest night of its source
 *   fills in what the recorded attempt did not measure, and leaves what it did measure as it was.
 * - A row is resolved only when its target was measured again and the finding was gone: a check that did not
 *   run, a target that errored or reported a tooling problem, a finding the reader dropped, an incomplete axe
 *   scan, a transcript that stopped, and a golden that was not compared leave their rows as they were. A row
 *   that comes back after being resolved is `flapping` until it has been seen `A11Y_FLAP_NIGHTS` nights in a
 *   row.
 * - The artifacts are a nightly's, on develop, but they are read as untrusted input all the same: every
 *   document and transcript is checked field by field, every string is bounded, a file over the cap is
 *   skipped, a map keyed by a name from an artifact is read through `Object.hasOwn`, and the page builds
 *   links from run numbers alone.
 * - Rows stay `A11Y_RETENTION_DAYS` from their last sighting; past `A11Y_CAP_BYTES` the oldest resolved rows
 *   go first, then the oldest nights, never an open row or the latest night of a source.
 * - A collection that adds nothing returns the stored document as it was, so the published file stays
 *   byte-identical, like the flake ledger and the durations document.
 *
 * No I/O in here. `scripts/test-health-collect.mjs` reads the artifacts and writes the file;
 * `.github/workflows/test-health.yml` runs it. The policy is `tests/AGENTS.md`, "A11y: the findings ledger
 * and the cluster catalog".
 */

import { EVIDENCE_CHECKS, EVIDENCE_SCHEMA, SEVERITIES, WCAG_CRITERIA, compareCriteria, targetKey } from '../../../tests/lib/a11y-evidence.mjs';
import { SITE_CHECKS, siteChecks, siteEvidenceArtifact } from '../../../tests/lib/a11y-site-checks.mjs';
import {
  AXE_SCAN_CHECK,
  AXE_SCAN_KIND,
  DOCS_SCAN_CHECK,
  READER_GOLDEN_DIFFERS,
  READER_TOKEN_MISSING,
  READER_TRAVERSAL_OFF,
  READER_TRAVERSAL_WHERE,
  TRIAGE_ID,
  clusterOf,
  findingShape,
  maskSelector,
} from '../../../tests/lib/a11y-issues.mjs';
import { DEFAULT_DOCS_BASE_URL } from '../../../tests/a11y/docs/constants.mjs';
import { SCENARIO_GROUPS } from '../../../tests/lib/screenreader-scenario.mjs';
import { DEFAULT_TOKEN_SEVERITY, TOKEN_SEVERITIES } from '../../../tests/lib/screenreader-transcript.mjs';
import { severityOfImpact } from '../../../tests/lib/a11y-verdict.mjs';

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
 * open row or the latest night of a source.
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
 * since the gap, the night it came back included; on that night it is `persisting` again.
 */
export const A11Y_FLAP_NIGHTS = 5;
/**
 * How many triage shapes the page lists; the section title gives the full count.
 */
export const A11Y_TRIAGE_SHOWN = 100;
export const A11Y_EVIDENCE_ARTIFACT = 'a11y-checks-evidence';
export const A11Y_AXE_ARTIFACT = 'a11y-axe-results';
/**
 * The docs site scan's artifact (`.github/workflows/docs-a11y.yml`): `a11y-findings.json` at its root, in the axe
 * scan's shape, with the docs pages and the light and dark color schemes.
 */
export const DOCS_AXE_ARTIFACT = 'docs-a11y-axe-results';
/**
 * The docs site checks' artifact (`.github/workflows/docs-a11y.yml`, the `checks` job): one evidence document per check
 * at its root, read like the product checks' into the docs night with the row source `docs-checks`.
 */
export const DOCS_CHECKS_ARTIFACT = siteEvidenceArtifact('docs');
/**
 * The axe scan's concise findings, at the axe artifact's root (`tests/lib/a11y-findings.mjs` writes it).
 */
export const A11Y_AXE_FILE = 'a11y-findings.json';
export const A11Y_AXE_SCHEMA = 1;
export const READER_ARTIFACT_PREFIX = 'screenreader-transcripts-';
/**
 * The project a reader artifact holds. The lane runs one job per project and scenario group
 * (`SCENARIO_GROUPS`), each uploading `screenreader-transcripts-<project>-<group>`, so the group is cut off
 * the name; a name without a group (`screenreader-transcripts-<project>`, the lane before the split) is
 * read as it is. Reading the whole rest as the project named no transcript's project, and every one was
 * skipped.
 *
 * @param {string} artifact The artifact name.
 * @returns {string} The project.
 */
export function readerArtifactProject(artifact) {
  const name = artifact.slice(READER_ARTIFACT_PREFIX.length);
  const group = SCENARIO_GROUPS.find(item => name.endsWith(`-${item}`));

  return group === undefined ? name : name.slice(0, -(group.length + 1));
}
/**
 * Where the transcripts sit inside a reader artifact: `tests/screenreader/screenreader.spec.ts` writes
 * `test-results/screenreader/transcripts/<project>--<scenario>.json`, and the upload strips the common
 * `tests/test-results/screenreader/` prefix.
 */
export const READER_TRANSCRIPTS_DIR = 'transcripts';
export const READER_TRANSCRIPT_SCHEMA = 1;
/**
 * The workflows whose runs the ledger reads, by their `name:`; `__tests__/a11y-ledger.test.mjs` pins
 * them against the workflow files and `test-health.yml`'s trigger list.
 */
export const A11Y_NIGHTLY_WORKFLOW = 'A11y nightly';
export const READER_NIGHTLY_WORKFLOW = 'Screen reader nightly';
export const DOCS_A11Y_WORKFLOW = 'Docs a11y';
/**
 * The events a run is recorded from: a dispatch (on the two nightlies the audit, on develop with no inputs:
 * their `check-inputs` job refuses a subset dispatch there, because the page draws the latest night of each
 * source and a subset night would show what it skipped as gone; the docs site scan runs by dispatch only)
 * and a schedule, which the two nightlies do not have today and which is kept here for the day a tier
 * brings a cron back (`.ai/CI.md`). All three workflows also run on a pull request that touches them, to
 * validate their graph; such a run is never recorded.
 */
export const A11Y_EVENTS = ['schedule', 'workflow_dispatch'];

/**
 * The most the collector reads of one document, and the longest string it keeps: a document past a count
 * limit is read up to it and covers nothing that night.
 */
export const A11Y_LIMITS = Object.freeze({ findings: 20000, steps: 500, where: 300, reason: 300, url: 300, issues: 200, locations: 20000 });

const DAY_MS = 24 * 60 * 60 * 1000;
const LIMITS = A11Y_LIMITS;
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
const SOURCE_OF_NIGHT = Object.freeze({ checks: 'a11y', axe: 'a11y', reader: 'reader', docs: 'docs', 'docs-checks': 'docs' });
/**
 * The night sources each recorded workflow's run holds. A list, so a workflow that calls several of the reusable
 * accessibility workflows (a full audit) names every source its run uploads.
 */
export const SOURCES_OF_WORKFLOW = Object.freeze({
  [A11Y_NIGHTLY_WORKFLOW]: Object.freeze(['a11y']),
  [READER_NIGHTLY_WORKFLOW]: Object.freeze(['reader']),
  [DOCS_A11Y_WORKFLOW]: Object.freeze(['docs']),
});
export const NIGHT_SOURCES = ['a11y', 'reader', 'docs'];

/**
 * @typedef {object} Finding
 * @property {'checks'|'axe'|'reader'|'docs'|'docs-checks'} source Where it came from.
 * @property {string} check The check id, `axe` for the gating scan, `docs-axe` for the docs site scan, a docs site check
 * (`docs-keyboard`), or the reader project (`nvda-chromium`).
 * @property {string} kind The finding kind; `axe-violation` for every finding of the scan; `token-missing` or
 * `golden-differs` for a reader step, `traversal-off` for a reader scenario's reading traversal (at `where`
 * `traversal`).
 * @property {string|null} rule The axe rule, when the finding names one.
 * @property {string|null} cause The discovery run's needs-review cause, when the finding names one.
 * @property {string} page The page id, or the reader scenario.
 * @property {string|null} theme The theme; `null` for a reader step.
 * @property {string|null} state The catalog state the target was in.
 * @property {string|null} variant The target's variant (`dark`, `rtl`, a check's own).
 * @property {string} where The masked selector, the step, or both (`<masked selector> @ <step>`).
 * @property {string[]} criteria The WCAG criteria.
 * @property {string|null} severity One of `SEVERITIES`. An axe finding's is its impact read the way its check run reads it
 * (`severityOfImpact()`: an impact axe did not give is serious); `null` for a baselined location of a findings document
 * written before the locations carried their impact.
 * @property {string} reason One sentence, bounded.
 * @property {string|null} url The fixture path, when the finding names one.
 * @property {string|null} issue The baseline issue an axe finding is filed under, or the one the scan suggests for a new one.
 */

/**
 * @typedef {object} Coverage
 * @property {Record<string, string[]>} checks Per check, the targets (`page|theme|variant`) it measured with every
 * step taken and every finding read.
 * @property {boolean|null} axe Whether the axe scan (on a docs night, the docs site scan) was complete and read whole;
 * `null` without one.
 * @property {string[]} reader The complete transcripts, every step read (`project|scenario`).
 * @property {string[]} golden The complete transcripts whose wording was compared with a golden, every difference read.
 */

/**
 * @typedef {object} Night
 * @property {'a11y'|'reader'|'docs'} source Which nightly, or the docs site scan, the artifacts are.
 * @property {Finding[]} findings What the night found.
 * @property {Coverage} coverage What the night measured. A row is resolved only inside it.
 * @property {number} problems The tooling problems the night reported.
 * @property {Record<string, {targets: number, measured: number, findings: number, problems: number}>} checks Per check document.
 * @property {{complete: boolean, findings: number, problems: number}|null} axe The scan document (the docs site scan's, on a
 * docs night).
 * @property {Record<string, Record<string, {steps: string[], failed: string[], golden: string, incomplete: string|null}>>} reader
 * Per project and scenario, the transcript's steps and verdicts.
 */

/**
 * Which family an artifact of the ledger's holds, by its name. The HTML report, the Playwright reports,
 * the recordings and the goldens are named outside it on purpose.
 *
 * @param {string} name The artifact name.
 * @returns {'checks'|'axe'|'reader'|'docs'|'docs-checks'|null} The family, or `null` for an unrelated artifact.
 */
export function classifyA11yArtifact(name) {
  if (name === A11Y_EVIDENCE_ARTIFACT) {
    return 'checks';
  }
  if (name === DOCS_CHECKS_ARTIFACT) {
    return 'docs-checks';
  }
  if (name === A11Y_AXE_ARTIFACT) {
    return 'axe';
  }
  if (name === DOCS_AXE_ARTIFACT) {
    return 'docs';
  }
  if (name.startsWith(READER_ARTIFACT_PREFIX)) {
    return 'reader';
  }

  return null;
}

/**
 * Whether a run's accessibility artifacts are recorded: a run of the `A11y nightly`, the `Screen reader
 * nightly` or `Docs a11y` on develop, started by its schedule or a dispatch. The branch alone is not enough:
 * the `Tests` pipeline uploads the same artifacts from a pull request's own code, and a fork's pull request
 * opened from the fork's `develop` reports `develop` as its branch. A fork cannot start a schedule or a dispatch
 * here.
 *
 * @param {{branch: string, event: string, workflow: string}} run The run.
 * @param {Record<string, readonly string[]>} [workflows] The recorded workflows and their sources (`SOURCES_OF_WORKFLOW`).
 * @returns {boolean} The verdict.
 */
export function isA11yRun(run, workflows = SOURCES_OF_WORKFLOW) {
  return run.branch === 'develop' && A11Y_EVENTS.includes(run.event) && Object.hasOwn(workflows, run.workflow);
}

/**
 * The night sources a recorded workflow's run holds: one per nightly, and the docs site scan's.
 *
 * @param {string} workflow The workflow's `name:`.
 * @param {Record<string, readonly string[]>} [workflows] The recorded workflows and their sources (`SOURCES_OF_WORKFLOW`).
 * @returns {readonly string[]} The sources; empty for a workflow the ledger does not read.
 */
export function sourcesOfWorkflow(workflow, workflows = SOURCES_OF_WORKFLOW) {
  return Object.hasOwn(workflows, workflow) ? workflows[workflow] : [];
}

/**
 * An own property of an object, or `undefined`: a map keyed by a name from an artifact (a project, a
 * scenario) is never read through the prototype, where `constructor` would answer.
 *
 * @param {unknown} object The object.
 * @param {string} key The key.
 * @returns {unknown} The value.
 */
function own(object, key) {
  return isObject(object) && Object.hasOwn(object, key) ? object[key] : undefined;
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
 * The target a record of a check names (a target or a finding), when its page, theme and variant read as
 * the evidence shape promises; `null` otherwise.
 *
 * @param {unknown} item The record.
 * @returns {{page: string, theme: string, variant: string|null}|null} The target.
 */
function readableTarget(item) {
  return isObject(item) && typeof item.page === 'string' && PAGE_ID.test(item.page) && typeof item.theme === 'string'
    && THEME.test(item.theme) && optionalToken(item.variant, TOKEN)
    ? { page: item.page, theme: item.theme, variant: item.variant ?? null }
    : null;
}

/**
 * A finding of a check document as the ledger keeps it, or `null` when a field the key or the page reads is
 * not what the evidence shape promises.
 *
 * @param {string} check The check.
 * @param {unknown} item The finding as the document holds it.
 * @param {'checks'|'docs-checks'} [source] The row source: a product check's, or a site check's.
 * @returns {Finding|null} The finding.
 */
function checkFinding(check, item, source = 'checks') {
  if (readableTarget(item) === null || typeof item.kind !== 'string' || !KEBAB.test(item.kind) || item.kind.length > 60
    || !SEVERITIES.includes(item.severity) || !validCriteria(item.criteria)
    || !optionalToken(item.state, TOKEN) || !optionalToken(item.rule, RULE) || !optionalToken(item.cause, CAUSE)
    || (typeof item.selector !== 'string' && typeof item.step !== 'string')) {
    return null;
  }

  const selector = typeof item.selector === 'string' ? maskSelector(item.selector) : null;
  const step = typeof item.step === 'string' ? cut(item.step, LIMITS.where) : null;
  const where = selector !== null && step !== null ? `${selector} @ ${step}` : (selector ?? step);

  return {
    source,
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
 * Why a reader scenario's reading traversal failed, as its check run says it (`lib/screenreader-report.mjs`):
 * the items read twice, never or out of order. A traversal that passed, or a transcript without one, has no
 * reason; one that is not a verdict object is malformed.
 *
 * @param {unknown} traversal The transcript's `traversal`.
 * @returns {{reason: string|null, malformed: boolean}} The reason.
 */
function traversalReason(traversal) {
  if (traversal === undefined || traversal === null) {
    return { reason: null, malformed: false };
  }
  if (!isObject(traversal) || typeof traversal.passed !== 'boolean' || !Array.isArray(traversal.items)) {
    return { reason: null, malformed: true };
  }
  if (traversal.passed) {
    return { reason: null, malformed: false };
  }

  const items = traversal.items.filter(entry => isObject(entry) && typeof entry.item === 'string' && Number.isInteger(entry.count));
  const twice = items.filter(entry => entry.count > 1).map(entry => `${cut(entry.item, 30)} x${entry.count}`);
  const never = items.filter(entry => entry.count === 0).map(entry => cut(entry.item, 30));
  const outOfOrder = (Array.isArray(traversal.outOfOrder) ? traversal.outOfOrder : []).filter(item => typeof item === 'string').map(item => cut(item, 30));
  const parts = [
    twice.length > 0 ? `read more than once: ${twice.join(', ')}` : '',
    never.length > 0 ? `never read: ${never.join(', ')}` : '',
    outOfOrder.length > 0 ? `out of order: ${outOfOrder.join(', ')}` : '',
  ].filter(Boolean);

  return { reason: `the reading traversal is off: ${parts.join('; ') || 'no item read as listed'}`, malformed: false };
}

/**
 * The severity of a reader step that missed a token group: the worst its missed groups carry, as its check run
 * counts it (`lib/screenreader-report.mjs`). A group without one (a transcript written before groups carried a
 * severity) is serious, the default a scenario step declares nothing against.
 *
 * @param {unknown[]} groups The step's token groups.
 * @returns {string} The severity.
 */
function stepSeverity(groups) {
  const missed = groups.filter(group => isObject(group) && group.matched === null)
    .map(group => (TOKEN_SEVERITIES.includes(group.severity) ? group.severity : DEFAULT_TOKEN_SEVERITY));

  return missed.reduce((worst, next) => (TOKEN_SEVERITIES.indexOf(next) < TOKEN_SEVERITIES.indexOf(worst) ? next : worst), missed[0] ?? DEFAULT_TOKEN_SEVERITY);
}

/**
 * Reads one check document into the night. Its coverage is the targets the check measured with every step
 * taken (a target with a tooling problem evaluates no criterion, `mergeEvidence()`, because the steps that
 * did not run left no finding), less the target of a finding the reader dropped; a document cut at the
 * findings limit, or a dropped finding with no readable target, covers nothing.
 *
 * A site check's document goes into its site's night under the site's row source, and only when it read the deploy
 * the night records (`baseUrl`): a dispatch on another deploy (a pull request's preview) is not the site.
 *
 * @param {{artifact: string, path: string, text: string}} file The file.
 * @param {string} label The file, for a note.
 * @param {Night} night The a11y night, or a site's.
 * @param {string[]} notes Where a note goes.
 * @param {object} [site] The site's checks: their registry, row source and deploy; the product's checks when absent.
 * @param {Record<string, object>} site.checks The registry.
 * @param {'docs-checks'} site.source The row source.
 * @param {string} site.baseUrl The deploy the night records.
 */
function readEvidence(file, label, night, notes, site = null) {
  const check = ROOT_JSON.exec(file.path)[1];
  const registry = site?.checks ?? EVIDENCE_CHECKS;

  if (!Object.hasOwn(registry, check)) {
    notes.push(site
      ? `${label}: ${check} is not a site check of SITE_CHECKS (tests/lib/a11y-site-checks.mjs), skipped`
      : `${label}: ${check} is not a check of EVIDENCE_CHECKS (tests/lib/a11y-evidence.mjs), skipped`);

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
  if (site && doc.run?.baseUrl !== site.baseUrl) {
    notes.push(`${label}: read ${cut(doc.run?.baseUrl ?? 'an unnamed deploy', 120)}, not the deploy the night records (${site.baseUrl}), skipped`);

    return;
  }

  const measured = doc.targets.filter(target => readableTarget(target) !== null && target.status === 'measured');
  const coverage = new Set(measured.filter(target => !(Number(target.problems) > 0)).map(targetKey));
  const truncated = doc.findings.length > LIMITS.findings;
  const findings = truncated ? doc.findings.slice(0, LIMITS.findings) : doc.findings;
  const kept = [];
  let malformed = 0;
  let unplaced = false;

  for (const item of findings) {
    const finding = checkFinding(check, item, site?.source);

    if (finding !== null) {
      kept.push(finding);
      continue;
    }
    malformed += 1;

    const target = readableTarget(item);

    if (target === null) {
      unplaced = true;
    } else {
      coverage.delete(targetKey(target));
    }
  }
  if (truncated) {
    notes.push(`${label}: ${doc.findings.length} findings, only the first ${LIMITS.findings} read; the check resolves nothing tonight`);
  }
  if (malformed > 0) {
    notes.push(`${label}: ${malformed} malformed finding(s) dropped; `
      + `${unplaced ? 'one names no readable target, so the check resolves nothing tonight' : 'their targets resolve nothing tonight'}`);
  }
  if (truncated || unplaced) {
    coverage.clear();
  }

  const problems = Array.isArray(doc.problems) ? doc.problems.length : 0;

  night.findings.push(...kept);
  night.coverage.checks[check] = [...coverage].sort();
  night.checks[check] = { targets: doc.targets.length, measured: measured.length, findings: kept.length, problems };
  night.problems += problems;
}

/**
 * Reads an axe scan's findings document into its night: every baselined location once (matched, grown or
 * improved, `issues[].locations`), and every new finding (`needsAction` with `status: 'new'`). A grown or
 * improved entry of `needsAction` is a location already read; a `fixed` one is gone. All of them are one kind,
 * so a finding keeps its row when it is baselined. Every finding is as severe as the `A11y / axe report` check run of
 * the same audit counts it: its impact, the one the scan gave it, through the verdict's own `severityOfImpact()`, so
 * the ledger and the check run cannot disagree on a severity. A location of a document written before the locations
 * carried their impact has none, and its row keeps a `null` severity until a night that names it. The scan covers its
 * rows only when it was complete (no tooling problem, no unverified page) and read whole. The product scan's document
 * goes into the a11y night with the source `axe`; the docs site scan's, in the same shape, into the docs night with
 * the source `docs`.
 *
 * @param {{artifact: string, path: string, text: string}} file The file.
 * @param {string} label The file, for a note.
 * @param {Night} night The a11y night, or the docs night.
 * @param {string[]} notes Where a note goes.
 * @param {{source: 'axe'|'docs', check: string}} [scan] The finding source and check the scan's rows carry.
 */
function readAxe(file, label, night, notes, { source = 'axe', check = AXE_SCAN_CHECK } = {}) {
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
  // A docs night is the develop staging deploy's. A dispatch can scan another deploy (`base-url`, a pull
  // request's preview), and its findings would open or resolve the staging rows.
  if (source === 'docs' && doc.baseUrl !== DEFAULT_DOCS_BASE_URL) {
    notes.push(`${label}: a scan of ${cut(JSON.stringify(doc.baseUrl ?? null), LIMITS.url)}, not the develop staging deploy `
      + `(${DEFAULT_DOCS_BASE_URL}), skipped`);

    return;
  }

  const kept = [];
  const truncated = doc.issues.length > LIMITS.issues || doc.needsAction.length > LIMITS.locations
    || doc.issues.some(issue => Array.isArray(issue?.locations) && issue.locations.length > LIMITS.locations);
  let malformed = 0;
  const location = (item, fields) => {
    if (!isObject(item) || typeof item.page !== 'string' || !PAGE_ID.test(item.page) || typeof item.theme !== 'string'
      || !THEME.test(item.theme) || typeof item.rule !== 'string' || !RULE.test(item.rule) || typeof item.target !== 'string') {
      malformed += 1;

      return;
    }
    kept.push({
      source,
      check,
      kind: AXE_SCAN_KIND,
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
        criteria: [...issue.wcag].sort(compareCriteria),
        severity: isObject(item) && Object.hasOwn(item, 'impact') ? severityOfImpact(item.impact) : null,
        reason: cut(issue.title, LIMITS.reason),
        url: null,
        issue: issue.id,
      });
    }
  }
  for (const item of doc.needsAction.slice(0, LIMITS.locations)) {
    if (isObject(item) && ['grown', 'improved', 'fixed'].includes(item.status)) {
      continue;
    }
    if (!isObject(item) || item.status !== 'new' || !validCriteria(item.wcag) || !optionalToken(item.issue, KEBAB)
      || !optionalToken(item.suggestedIssue, KEBAB)) {
      malformed += 1;
      continue;
    }
    location(item, {
      criteria: [...item.wcag].sort(compareCriteria),
      severity: severityOfImpact(item.impact),
      reason: cut(item.help ?? item.rule, LIMITS.reason),
      url: fixturePath(item.url),
      issue: item.issue ?? item.suggestedIssue ?? null,
    });
  }
  if (truncated) {
    notes.push(`${label}: past the issues or locations limit, only the first entries read; the scan resolves nothing tonight`);
  }
  if (malformed > 0) {
    notes.push(`${label}: ${malformed} malformed finding(s) dropped; the scan resolves nothing tonight`);
  }

  const problems = Array.isArray(doc.problems) ? doc.problems.length : 0;
  const complete = problems === 0 && doc.counts.unverified === 0 && !truncated && malformed === 0;

  night.findings.push(...kept);
  night.coverage.axe = complete;
  night.axe = { complete, findings: kept.length, problems };
  night.problems += problems;
}

/**
 * Reads one transcript into the reader night. A complete transcript, every step read, covers its token rows;
 * its golden rows only when its wording was compared with a golden (`match` or `differs`, every difference
 * read): a transcript that recorded the golden or had none compared nothing.
 *
 * @param {{artifact: string, path: string, text: string}} file The file.
 * @param {string} label The file, for a note.
 * @param {Night} night The reader night.
 * @param {string[]} notes Where a note goes.
 */
function readTranscript(file, label, night, notes) {
  const project = readerArtifactProject(file.artifact);

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
  if (own(own(night.reader, project), doc.scenario) !== undefined) {
    notes.push(`${label}: a second transcript of ${doc.scenario} on ${project}, skipped`);

    return;
  }

  const scenario = doc.scenario;
  const truncatedSteps = doc.steps.length > LIMITS.steps;
  const stepList = truncatedSteps ? doc.steps.slice(0, LIMITS.steps) : doc.steps;
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

  if (truncatedSteps) {
    notes.push(`${label}: ${doc.steps.length} steps, only the first ${LIMITS.steps} read; the transcript resolves nothing tonight`);
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
      night.findings.push(reader(READER_TOKEN_MISSING, step.id, stepSeverity(step.tokens.groups), `the announcement lacks: ${missing.join(', ')}`));
    }
  }
  if (malformed > 0) {
    notes.push(`${label}: ${malformed} malformed step(s) dropped; the transcript resolves nothing tonight`);
  }

  const traversal = traversalReason(doc.traversal);

  if (traversal.malformed) {
    notes.push(`${label}: the reading traversal is not a verdict, skipped`);
  } else if (traversal.reason !== null) {
    night.findings.push(reader(READER_TRAVERSAL_OFF, READER_TRAVERSAL_WHERE, DEFAULT_TOKEN_SEVERITY, traversal.reason));
  }

  const golden = isObject(doc.golden) && typeof doc.golden.status === 'string' ? cut(doc.golden.status, 20) : 'missing';
  const rawDifferences = Array.isArray(doc.golden?.differences) ? doc.golden.differences : [];
  const truncatedDifferences = rawDifferences.length > LIMITS.steps;
  let malformedDifferences = 0;

  for (const difference of rawDifferences.slice(0, LIMITS.steps)) {
    if (!isObject(difference) || typeof difference.id !== 'string' || !STEP_ID.test(difference.id)) {
      malformedDifferences += 1;
      continue;
    }
    // A recorded step the scenario no longer has (`actual: null`) is the golden's to update, not a finding.
    if (difference.actual === null) {
      continue;
    }

    const heard = `heard ${JSON.stringify(cut(difference.actual, 100))}`;

    night.findings.push(reader(READER_GOLDEN_DIFFERS, difference.id, 'advisory', difference.expected === null || difference.expected === undefined
      ? `no golden for this step, ${heard}`
      : `expected ${JSON.stringify(cut(difference.expected, 100))}, ${heard}`));
  }
  if (truncatedDifferences || malformedDifferences > 0) {
    notes.push(`${label}: the golden differences were not read whole; its golden rows resolve nothing tonight`);
  }

  const incomplete = isObject(doc.incomplete) && typeof doc.incomplete.step === 'string' ? cut(doc.incomplete.step, 100) : null;
  const complete = incomplete === null && !truncatedSteps && malformed === 0;
  const pair = `${project}|${scenario}`;

  if (complete) {
    night.coverage.reader.push(pair);
    night.coverage.reader.sort();

    if ((golden === 'match' || golden === 'differs') && !truncatedDifferences && malformedDifferences === 0) {
      night.coverage.golden.push(pair);
      night.coverage.golden.sort();
    }
  }
  if (incomplete !== null) {
    night.problems += 1;
  }
  // The project and the scenario are kebab-case, never `__proto__`; a plain assignment defines an own property.
  if (own(night.reader, project) === undefined) {
    night.reader[project] = {};
  }
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
 * @param {'a11y'|'reader'|'docs'} source The source.
 * @returns {Night} The night.
 */
function emptyNight(source) {
  return {
    source,
    findings: [],
    coverage: { checks: {}, axe: null, reader: [], golden: [] },
    problems: 0,
    checks: {},
    axe: null,
    reader: {},
  };
}

/**
 * The nights a run's accessibility artifacts hold: the a11y night (the check documents at the evidence
 * artifact's root and the findings at the axe artifact's root), the reader night (the transcripts of
 * every `screenreader-transcripts-<project>-<group>` artifact) and the docs night (the findings at the docs
 * site scan's artifact root, and the docs site checks' documents at their artifact's root). Everything else in those artifacts (the per-test folders, the detail files, the
 * comparison, the scans, the logs) is ignored. A file that does not parse,
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
  const docs = emptyNight('docs');
  let sawA11y = false;
  let sawReader = false;
  let sawDocs = false;

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
    } else if (family === 'docs' && file.path === A11Y_AXE_FILE) {
      sawDocs = true;
      readAxe(file, label, docs, notes, { source: 'docs', check: DOCS_SCAN_CHECK });
    } else if (family === 'docs-checks' && ROOT_JSON.test(file.path)) {
      sawDocs = true;
      readEvidence(file, label, docs, notes, { checks: siteChecks('docs'), source: 'docs-checks', baseUrl: DEFAULT_DOCS_BASE_URL });
    }
  }

  return { nights: [...(sawA11y ? [a11y] : []), ...(sawReader ? [reader] : []), ...(sawDocs ? [docs] : [])], notes };
}

/**
 * What identifies a finding across nights: its source, check and kind, the axe rule and cause it names,
 * its target (page, theme, state, variant) and the masked selector or step. Never the reason, the
 * severity, the criteria or the baseline issue, which a check or a baseline change may reword or refile.
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
 * @returns {'a11y'|'reader'|'docs'} The source.
 */
function nightSourceOf(row) {
  return SOURCE_OF_NIGHT[row.source];
}

/**
 * A night's coverage in the stored form: every list sorted, the checks by id.
 *
 * @param {Coverage} coverage The coverage.
 * @returns {Coverage} The copy.
 */
function storedCoverage(coverage) {
  const checks = coverage?.checks ?? {};

  return {
    checks: Object.fromEntries(Object.keys(checks).sort().map(check => [check, [...checks[check]].sort()])),
    axe: coverage?.axe ?? null,
    reader: [...(coverage?.reader ?? [])].sort(),
    golden: [...(coverage?.golden ?? [])].sort(),
  };
}

/**
 * What two attempts of one night measured together.
 *
 * @param {Coverage} a One attempt's coverage.
 * @param {Coverage} b The other's.
 * @returns {Coverage} The union, in the stored form.
 */
function unionCoverage(a, b) {
  const checks = {};

  for (const coverage of [a, b]) {
    for (const check of Object.keys(coverage?.checks ?? {})) {
      checks[check] = [...new Set([...(own(checks, check) ?? []), ...coverage.checks[check]])];
    }
  }

  let axe = null;

  if (a?.axe === true || b?.axe === true) {
    axe = true;
  } else if (a?.axe === false || b?.axe === false) {
    axe = false;
  }

  return storedCoverage({
    checks,
    axe,
    reader: [...new Set([...(a?.reader ?? []), ...(b?.reader ?? [])])],
    golden: [...new Set([...(a?.golden ?? []), ...(b?.golden ?? [])])],
  });
}

/**
 * A coverage as sets, for `covered()`.
 *
 * @param {Coverage} coverage The coverage.
 * @returns {{checks: Map<string, Set<string>>, axe: boolean, reader: Set<string>, golden: Set<string>}} The index.
 */
function coverageIndex(coverage) {
  return {
    checks: new Map(Object.keys(coverage?.checks ?? {}).map(check => [check, new Set(coverage.checks[check])])),
    axe: coverage?.axe === true,
    reader: new Set(coverage?.reader ?? []),
    golden: new Set(coverage?.golden ?? []),
  };
}

/**
 * Whether a night measured a row's target, so that the row's absence means the finding is gone.
 *
 * @param {object} row The row or finding.
 * @param {ReturnType<typeof coverageIndex>} index The night's coverage.
 * @returns {boolean} The verdict.
 */
function covered(row, index) {
  if (row.source === 'checks' || row.source === 'docs-checks') {
    return index.checks.get(row.check)?.has(targetKey(row)) ?? false;
  }
  // The docs night keeps its scan's coverage in the same field: a night holds one source's rows.
  if (row.source === 'axe' || row.source === 'docs') {
    return index.axe;
  }

  return (row.kind === READER_GOLDEN_DIFFERS ? index.golden : index.reader).has(`${row.check}|${row.page}`);
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

  return row.gaps > 0 && row.seenSinceGap < A11Y_FLAP_NIGHTS ? 'flapping' : 'persisting';
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
 * A night's counts, read from the rows after its merge: the rows of its source it sighted (`lastRun`), the
 * ones that were new on it (`firstRun`), the ones it resolved (`resolvedAt` is its time), and per cluster.
 *
 * @param {object[]} rows The rows.
 * @param {string} runId The night's run.
 * @param {'a11y'|'reader'|'docs'} source The night's source.
 * @param {string} at The night's time.
 * @returns {object} The counts.
 */
function nightStats(rows, runId, source, at) {
  const ofSource = rows.filter(row => nightSourceOf(row) === source);
  const sighted = ofSource.filter(row => row.lastRun === runId);
  const resolved = ofSource.filter(row => row.status === 'resolved' && row.resolvedAt === at);
  const triage = sighted.filter(row => row.cluster === TRIAGE_ID);
  const clusters = new Map();
  const bump = (id, field) => {
    const entry = clusters.get(id) ?? { seen: 0, new: 0, resolved: 0 };

    entry[field] += 1;
    clusters.set(id, entry);
  };

  for (const row of sighted) {
    bump(row.cluster, 'seen');

    if (row.firstRun === runId) {
      bump(row.cluster, 'new');
    }
  }
  for (const row of resolved) {
    bump(row.cluster, 'resolved');
  }

  return {
    findings: sighted.length,
    new: sighted.filter(row => row.firstRun === runId).length,
    resolved: resolved.length,
    flapping: sighted.filter(row => row.status === 'flapping').length,
    triage: triage.length,
    triageShapes: new Set(triage.map(findingShape)).size,
    clusters: Object.fromEntries([...clusters.keys()].sort().map(id => [id, clusters.get(id)])),
  };
}

/**
 * The night's per-check, scan and transcript summaries, with a later attempt's over an earlier one's.
 *
 * @param {object|null} earlier The recorded night, when a later attempt amends it.
 * @param {Night} night The night.
 * @returns {object} The fields for the night record.
 */
function nightSummaries(earlier, night) {
  if (night.source === 'a11y') {
    return { checks: { ...(earlier?.checks ?? {}), ...night.checks }, axe: night.axe ?? earlier?.axe ?? null };
  }
  if (night.source === 'docs') {
    const checks = { ...(earlier?.checks ?? {}), ...night.checks };

    return { axe: night.axe ?? earlier?.axe ?? null, ...(Object.keys(checks).length > 0 ? { checks } : {}) };
  }

  const reader = {};

  for (const source of [earlier?.reader ?? {}, night.reader]) {
    for (const project of Object.keys(source)) {
      reader[project] = { ...(own(reader, project) ?? {}), ...source[project] };
    }
  }

  return { reader: Object.fromEntries(Object.keys(reader).sort().map(project => [project, reader[project]])) };
}

/**
 * Merges one night into the ledger.
 *
 * - Every finding of the night becomes a row, or updates its row: `lastSeen`, `nightsSeen`, the latest
 *   severity, criteria, reason, url and baseline issue. A row seen for the first time is `new`; one seen again
 *   is `persisting`, or `flapping` when it came back after being resolved and has not yet been seen
 *   `A11Y_FLAP_NIGHTS` nights in a row since.
 * - A row of the night's source that the night did not find is `resolved` when the night measured its
 *   target (`coverage`), and left as it was otherwise.
 * - A later attempt of the latest night of its source (a "Re-run failed jobs" of the nightly, which keeps the
 *   run id and replaces its artifacts) amends that night: it adds the sightings and the resolutions on what
 *   the recorded attempt did not measure, and leaves what the recorded attempt measured as it was. The night
 *   keeps its time, and its coverage grows. An attempt that measured nothing new changes nothing.
 * - Every row is then sorted into its cluster by the catalog, so an edit to the catalog re-sorts the whole
 *   ledger on the next night; a row that matches two clusters goes to the first, with one note per set of
 *   clusters.
 * - The night is recorded with its counts, per cluster, for the trend, and with its coverage while it is the
 *   latest night of its source (what a later attempt is measured against). A run whose workflow holds several
 *   sources records one night per source: a night is the run and its source. A run of another workflow than the
 *   night's source, an attempt already recorded, a run older than the latest night of its source, or a night
 *   with no readable document changes nothing.
 * - Rows past the retention window (from their last sighting) and nights past it go; past the cap, the
 *   oldest resolved rows go first, then the oldest nights, never the latest night of a source.
 *
 * @param {object|null} previous The ledger as read from `gh-pages`, or `null`.
 * @param {Night} night The night (`readA11yArtifacts`).
 * @param {import('./test-health.mjs').RunContext} run The collected run (`isA11yRun`).
 * @param {object} catalog The compiled cluster catalog (`compileIssuesCatalog`).
 * @param {object} options Options.
 * @param {Date} options.now The current time.
 * @param {number} [options.retentionDays] Override of `A11Y_RETENTION_DAYS`.
 * @param {number} [options.capBytes] Override of `A11Y_CAP_BYTES`.
 * @param {Record<string, readonly string[]>} [options.workflows] The recorded workflows and their sources
 * (`SOURCES_OF_WORKFLOW`); a test passes a workflow that holds several.
 * @returns {{doc: object, changed: boolean, notes: string[], recorded: object|null, ambiguous: Array<{clusters: string[], rows: number}>}}
 * The ledger, whether its text changed, the notes, what the night recorded (`null` when nothing was), and the
 * sets of clusters some rows match more than one of.
 */
export function mergeA11yLedger(previous, night, run, catalog, {
  now, retentionDays = A11Y_RETENTION_DAYS, capBytes = A11Y_CAP_BYTES, workflows = SOURCES_OF_WORKFLOW,
}) {
  assertA11yVersion(previous ?? null);

  if (!isA11yRun(run, workflows)) {
    throw new Error(`run ${run.runId} is a ${run.event} run of ${run.workflow} on ${run.branch}; only the A11y and Screen reader `
      + 'nightlies and the docs site scan on develop, by schedule or dispatch, are recorded');
  }
  if (!RUN_ID.test(String(run.runId))) {
    throw new Error(`run id ${JSON.stringify(run.runId)} is not a run id`);
  }

  const seenAt = Date.parse(run.seenAt);

  if (Number.isNaN(seenAt)) {
    throw new Error(`run ${run.runId} has no completion time (${JSON.stringify(run.seenAt)})`);
  }

  const prior = previous ?? emptyA11yLedger({ retentionDays, capBytes });
  const notes = [];
  const unchanged = () => ({ doc: prior, changed: false, notes, recorded: null, ambiguous: [] });
  const { source } = night;
  const where = `run ${run.runId} (${source})`;

  if (!sourcesOfWorkflow(run.workflow, workflows).includes(source)) {
    notes.push(`${where}: a ${run.workflow} run holds no ${source} night, nothing recorded`);

    return unchanged();
  }

  // A night is readable when one of its documents was read, whatever it covers: a night of transcripts that
  // all stopped resolves nothing, and is still recorded, so the page shows where they stopped.
  const readable = night.findings.length > 0 || Object.keys(night.checks).length > 0 || night.axe !== null
    || Object.keys(night.reader).length > 0;

  if (!readable) {
    notes.push(`${where}: no readable accessibility document, nothing recorded`);

    return unchanged();
  }

  // A night is a run and its source: a workflow that holds several sources records one night for each.
  const earlier = prior.nights.find(entry => entry.runId === run.runId && entry.source === source) ?? null;
  const latest = prior.latest?.[source] ?? null;

  if (earlier !== null && run.runAttempt <= earlier.runAttempt) {
    notes.push(`${where} attempt ${run.runAttempt} is already recorded (attempt ${earlier.runAttempt}); a run is read once per attempt, `
      + 'nothing recorded');

    return unchanged();
  }
  if (earlier !== null && (latest?.runId !== run.runId || !isObject(earlier.coverage))) {
    notes.push(`${where} attempt ${run.runAttempt}: attempt ${earlier.runAttempt} is recorded and a later ${source} night followed it; `
      + 'a later attempt amends the latest night of its source only, nothing recorded');

    return unchanged();
  }
  if (earlier === null && latest && seenAt < Date.parse(latest.seenAt)) {
    notes.push(`${where} completed ${run.seenAt}, before the latest ${source} night ${latest.runId} (${latest.seenAt}); `
      + 'nights are recorded in order, nothing recorded');

    return unchanged();
  }

  // The run's completion time as the API gives it, like the flake ledger's `seenAt`: never re-serialized, so a
  // re-collection compares equal. A later attempt keeps the night's time: it is the same night.
  const at = earlier?.seenAt ?? run.seenAt;
  const measuredBefore = earlier === null ? null : coverageIndex(earlier.coverage);
  const tonight = coverageIndex(night.coverage);
  const rows = new Map(prior.rows.map(row => [row.key, { ...row }]));
  const handled = new Set();
  let sightings = 0;
  let resolutions = 0;

  for (const finding of night.findings) {
    const key = findingKey(finding);

    if (handled.has(key)) {
      continue;
    }
    handled.add(key);

    // Where the recorded attempt measured, its verdict stands; a row it sighted is not counted twice.
    if (measuredBefore !== null && covered(finding, measuredBefore)) {
      continue;
    }

    const latestFields = { criteria: finding.criteria, severity: finding.severity, reason: finding.reason, url: finding.url, issue: finding.issue };
    const row = rows.get(key);

    if (row?.lastRun === run.runId) {
      continue;
    }
    sightings += 1;

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

  // No guard for what an earlier attempt measured: that attempt resolved every row it measured and did not see,
  // and the rows it saw carry this run as `lastRun`.
  for (const row of rows.values()) {
    if (nightSourceOf(row) !== source || row.lastRun === run.runId || row.status === 'resolved' || !covered(row, tonight)) {
      continue;
    }
    row.status = 'resolved';
    row.resolvedAt = at;
    row.gaps += 1;
    row.seenSinceGap = 0;
    resolutions += 1;
  }

  const coverage = earlier === null ? storedCoverage(night.coverage) : unionCoverage(earlier.coverage, night.coverage);

  if (earlier !== null && sightings === 0 && resolutions === 0 && JSON.stringify(coverage) === JSON.stringify(storedCoverage(earlier.coverage))) {
    notes.push(`${where} attempt ${run.runAttempt} measured nothing attempt ${earlier.runAttempt} had not; the night is already recorded, `
      + 'nothing recorded');

    return unchanged();
  }

  const overlaps = new Map();

  for (const row of rows.values()) {
    const verdict = clusterOf(row, catalog);

    row.cluster = verdict.id;
    row.tracker = verdict.tracker;

    if (verdict.ambiguous.length > 0) {
      const set = verdict.ambiguous.join(', ');

      overlaps.set(set, (overlaps.get(set) ?? 0) + 1);
    }
  }

  const ambiguous = [...overlaps].sort(([a], [b]) => a.localeCompare(b)).map(([set, count]) => ({ clusters: set.split(', '), rows: count }));

  for (const { clusters, rows: count } of ambiguous) {
    notes.push(`${count} row(s) match clusters ${clusters.join(', ')}; sorted to ${clusters[0]}; tests/a11y/issues.json needs one rule per finding`);
  }

  const stats = nightStats([...rows.values()], run.runId, source, at);
  const record = {
    runId: run.runId,
    runAttempt: run.runAttempt,
    source,
    workflow: run.workflow,
    event: run.event,
    branch: run.branch,
    headSha: run.headSha,
    seenAt: at,
    findings: stats.findings,
    new: stats.new,
    resolved: stats.resolved,
    flapping: stats.flapping,
    triage: stats.triage,
    triageShapes: stats.triageShapes,
    problems: night.problems,
    clusters: stats.clusters,
    ...nightSummaries(earlier, night),
    coverage,
  };

  // Retention: from a row's last sighting, and a night's completion. Only the latest night of a source keeps its
  // coverage: it is what a later attempt of that night is measured against.
  const cutoff = now.getTime() - (retentionDays * DAY_MS);
  const keptRows = [...rows.values()].filter(row => Date.parse(row.lastSeen) >= cutoff);
  const droppedRows = rows.size - keptRows.length;
  const others = prior.nights.filter(entry => entry.runId !== run.runId || entry.source !== source)
    .map(({ coverage: stored, ...entry }) => (entry.source === source ? entry : { ...entry, ...(stored ? { coverage: stored } : {}) }));
  const keptNights = sortNights([...others, record]).filter(entry => Date.parse(entry.seenAt) >= cutoff);

  if (droppedRows > 0) {
    notes.push(`${droppedRows} row(s) older than ${retentionDays} days dropped`);
  }

  const head = {
    version: A11Y_VERSION,
    // Sized with a timestamp in place: the final value is `now`, of this length.
    updatedAt: now.toISOString(),
    retentionDays,
    capBytes,
    trendNights: A11Y_TREND_NIGHTS,
    flapNights: A11Y_FLAP_NIGHTS,
    latest: earlier === null ? { ...prior.latest, [source]: { runId: run.runId, seenAt: at } } : { ...prior.latest },
  };
  const latestRuns = new Set(NIGHT_SOURCES.map(entry => head.latest?.[entry]?.runId).filter(Boolean));
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
  // Then the oldest nights (the list is newest first), never the latest night of a source.
  while (size > capBytes) {
    const oldest = currentNights.findLastIndex(entry => !latestRuns.has(entry.runId));

    if (oldest === -1) {
      break;
    }
    currentNights = currentNights.filter((_, index) => index !== oldest);
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

  const recorded = {
    source,
    runId: run.runId,
    runAttempt: run.runAttempt,
    amended: earlier !== null,
    findings: stats.findings,
    new: stats.new,
    resolved: stats.resolved,
    flapping: stats.flapping,
    triage: stats.triage,
    triageShapes: stats.triageShapes,
    clusters: Object.entries(stats.clusters).map(([id, entry]) => [id, entry.seen])
      .sort((a, b) => Number(a[0] === TRIAGE_ID) - Number(b[0] === TRIAGE_ID) || b[1] - a[1] || a[0].localeCompare(b[0])),
  };

  // A merge that reaches here added or amended a night record, so the text changed; the no-ops returned the
  // prior document above, stamp included.
  return { doc, changed: true, notes, recorded, ambiguous };
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
 * A cluster's trend has one series per source its rules or rows come from, over that source's nights only:
 * the two nightlies run an hour apart, and one series over both would draw a reader-only cluster at zero on
 * every A11y night.
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
  const nightsBySource = NIGHT_SOURCES.flatMap(source => sortNights(doc.nights.filter(night => night.source === source))
    .slice(0, A11Y_TREND_NIGHTS));
  const nights = nightsBySource.sort((a, b) => Date.parse(a.seenAt) - Date.parse(b.seenAt) || a.runId.localeCompare(b.runId, 'en', { numeric: true }));
  const nightSources = NIGHT_SOURCES.filter(source => nights.some(night => night.source === source));
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
    const members = rows.filter(row => row.cluster === id);
    const ownOpen = members.filter(row => row.status !== 'resolved');
    const byStatus = status => members.filter(row => row.status === status).length;
    const entry = titles.get(id);
    const named = new Set([...(entry?.match ?? []).map(rule => SOURCE_OF_NIGHT[rule.source]), ...members.map(nightSourceOf)]);
    const sources = named.size > 0 ? NIGHT_SOURCES.filter(source => named.has(source)) : nightSources;

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
      nightsSeen: doc.nights.filter(night => (own(night.clusters, id)?.seen ?? 0) > 0).length,
      lastSeen: members.reduce((last, row) => (last === null || Date.parse(row.lastSeen) > Date.parse(last) ? row.lastSeen : last), null),
      severities: Object.fromEntries(countBy(ownOpen, row => row.severity)),
      criteria: countBy(ownOpen.flatMap(row => row.criteria), id2 => id2).sort((a, b) => compareCriteria(a[0], b[0])),
      sources: countBy(ownOpen, row => row.source),
      kinds: countBy(ownOpen, row => row.kind).slice(0, 8),
      pages: countBy(ownOpen, row => row.page).slice(0, 5),
      // One series per source: [night index, seen, new, resolved] for every night of that source in the trend.
      trends: sources.map(source => ({
        source,
        points: nights.map((night, index) => [index, night]).filter(([, night]) => night.source === source).map(([index, night]) => {
          const counts = own(night.clusters, id) ?? { seen: 0, new: 0, resolved: 0 };

          return [index, counts.seen, counts.new, counts.resolved];
        }),
      })),
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
  const latestDocs = nightOf('docs');

  if (latestDocs?.axe) {
    checks.push({ check: DOCS_SCAN_CHECK, title: 'docs site axe scan', targets: null, measured: null, findings: latestDocs.axe.findings,
      problems: latestDocs.axe.problems });
  }
  for (const check of Object.keys(latestDocs?.checks ?? {}).sort()) {
    checks.push({ check, title: SITE_CHECKS[check]?.title ?? check, ...latestDocs.checks[check] });
  }

  const latestReader = nightOf('reader');
  const reader = { projects: [], scenarios: [] };

  if (latestReader) {
    const goldenRows = new Set(rows.filter(row => row.source === 'reader' && row.kind === READER_GOLDEN_DIFFERS && row.lastRun === latestReader.runId)
      .map(row => `${row.check}|${row.page}|${row.where}`));
    const transcripts = isObject(latestReader.reader) ? latestReader.reader : {};

    reader.projects = Object.keys(transcripts).sort();

    const scenarioIds = [...new Set(reader.projects.flatMap(project => Object.keys(transcripts[project] ?? {})))].sort();

    reader.scenarios = scenarioIds.map((scenario) => {
      const steps = [];
      const verdicts = {};
      const golden = {};
      const incomplete = {};

      for (const project of reader.projects) {
        const transcript = own(transcripts[project], scenario);

        if (!isObject(transcript)) {
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

  const triageShapes = [...shapes.values()].map(({ statuses, ...shape }) => ({
    ...shape,
    criteria: [...shape.criteria].sort(compareCriteria),
    pages: shape.pages.size,
    status: statuses.has('flapping') ? 'flapping' : (statuses.has('persisting') ? 'persisting' : 'new'),
  })).sort((a, b) => b.pages - a.pages
    || SEVERITIES.indexOf(a.severity ?? 'advisory') - SEVERITIES.indexOf(b.severity ?? 'advisory')
    || `${a.check}|${a.kind}|${a.where}`.localeCompare(`${b.check}|${b.kind}|${b.where}`));

  return {
    updatedAt: doc.updatedAt,
    retentionDays: doc.retentionDays,
    trendNights: doc.trendNights ?? A11Y_TREND_NIGHTS,
    flapNights: doc.flapNights ?? A11Y_FLAP_NIGHTS,
    latest: { a11y: latestOf('a11y'), reader: latestOf('reader'), docs: latestOf('docs') },
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
    // [run id, seen at, source, findings, new, resolved, need triage, problems, attempt], oldest first.
    nights: nights.map(night => [night.runId, night.seenAt, night.source, night.findings, night.new, night.resolved, night.triage,
      night.problems, night.runAttempt]),
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
  return recorded.filter(Boolean).map(entry => `Accessibility: ${entry.source} night ${entry.runId} `
    + `${entry.amended ? `amended by attempt ${entry.runAttempt}, now` : 'recorded'} ${entry.findings} findings `
    + `(${entry.new} new, ${entry.resolved} resolved, ${entry.flapping} flapping, ${entry.triage} need triage)`
    + (entry.clusters.length > 0 ? `; clusters: ${entry.clusters.map(([id, seen]) => `${id} ${seen}`).join(', ')}.` : '.')).join(' ');
}
