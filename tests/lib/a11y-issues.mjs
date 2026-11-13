/**
 * The accessibility findings' cluster catalog: the pure half.
 *
 * The nightlies leave thousands of records a night (the axe discovery run alone about 3,900), most of
 * them the same few defects on many pages. `a11y/issues.json` is the catalog that sorts them into
 * root-cause clusters: one entry per known problem, with a stable id local to this repository, a title
 * that says what the problem is, optionally the tracker task (or tasks) that own the fix, and the
 * rules that say which findings belong to it. It extends the axe baseline's issue catalog
 * (`a11y/axe-baseline.json`, `lib/a11y-baseline.mjs`): the same id, title and tracker fields, plus
 * `match`. A finding that matches no cluster lands in `needs-triage`; one that matches two is a
 * catalog error, which `lib/__tests__/a11y-issues.test.mjs` refuses before it can reach the ledger.
 *
 * A match rule names the `source` a finding came from (`checks`: the checks beyond axe; `axe`: the
 * gating scan; `reader`: the screen reader lanes; `docs`: the docs site scan; `docs-checks`: the checks beyond axe on
 * the docs site, `SITE_CHECKS` of `lib/a11y-site-checks.mjs`) and any of: `checks` (check ids, or reader projects),
 * `kinds`, `rules` (axe rule ids), `causes` (the discovery run's needs-review causes), `criteria` (WCAG
 * ids), `pages` (anchored patterns on the page id, or the reader scenario), `themes`, `where` (patterns
 * searched in the finding's `where`) and `axeIssues` (the baseline issue an axe or docs finding is filed
 * under, or the one the scan suggests for a new finding of a known rule and target; a docs rule names the
 * docs baseline's issues, `a11y/docs/docs-baseline.json`). The values of a field are
 * ORed, the fields of a rule ANDed, the rules of a cluster ORed. A finding's `where` is its masked
 * selector, its step, or both joined as `<masked selector> @ <step>` (a keyboard-walker stop, a probe), so
 * a pattern anchored with `^` reads from the selector's start and one anchored with `$` up to the step's end.
 * A field a finding of the rule's source never carries (a reader step has no rule, theme or criterion; a
 * check has no baseline issue) is refused, because such a rule could never match.
 *
 * `maskSelector()` is what keeps a finding's identity across nights: the formula builder marks each
 * reference's cells with a class that carries the instance's random id (`ht-formula-ref-fill-ht_<hash>-2`),
 * the selection border carries the layer that drew it (`.wtBorder.area`), and a menu item is
 * `htDisabled` or not depending on the selection. The ledger keys a row on the masked text, and a rule's
 * `where` pattern is matched against it.
 *
 * The ledger that reads this lives in `.github/scripts/lib/a11y-ledger.mjs`; the policy is
 * `tests/AGENTS.md`, "A11y: the findings ledger and the cluster catalog". No I/O in here.
 */
import { A11Y_THEMES, VOLATILE_CLASSES } from './a11y-baseline.mjs';
import { EVIDENCE_CHECKS, WCAG_CRITERIA } from './a11y-evidence.mjs';
import { SITES, siteChecks } from './a11y-site-checks.mjs';
import { DOCS_THEMES } from '../a11y/docs/constants.mjs';

export const ISSUES_SCHEMA = 1;
export const ISSUES_FILE = 'a11y/issues.json';
/**
 * The cluster a finding lands in when no rule matches it. Reserved: a catalog cluster cannot take the id.
 */
export const TRIAGE_ID = 'needs-triage';
/**
 * The finding source of each site's checks beyond axe (`docs-checks`): a source of its own, so a rule written for the
 * product's checks never matches a site's finding, and the other way round.
 */
export const SITE_SOURCES = Object.freeze(Object.fromEntries(SITES.map(site => [`${site}-checks`, site])));
// The color schemes a site's findings carry.
const SITE_THEMES = Object.freeze({ docs: DOCS_THEMES });
export const FINDING_SOURCES = ['checks', 'axe', 'reader', 'docs', ...Object.keys(SITE_SOURCES)];
/**
 * The fields a match rule may carry, `source` first. A rule needs `source` and at least one other.
 */
export const MATCH_FIELDS = ['source', 'checks', 'kinds', 'rules', 'causes', 'criteria', 'pages', 'themes', 'where', 'axeIssues'];
/**
 * The gating axe scan's findings as the ledger reads them: one check and one kind, whatever the baseline says
 * of the location (known, grown, new), so a finding keeps its identity when it is baselined.
 */
export const AXE_SCAN_CHECK = 'axe';
export const AXE_SCAN_KIND = 'axe-violation';
/**
 * The docs site scan's findings (`tests/a11y/docs/`): the same kind as the gating scan's, under a check of
 * their own, so a docs finding never matches a rule written for the product.
 */
export const DOCS_SCAN_CHECK = 'docs-axe';
/**
 * The kinds of a screen reader finding: a required token group missing from a step's announcement, an
 * announcement whose wording differs from the recorded golden, and a reading traversal that read an item
 * twice, never or out of order. A traversal spans steps, so its finding sits at `READER_TRAVERSAL_WHERE`
 * rather than at a step id.
 */
export const READER_TOKEN_MISSING = 'token-missing';
export const READER_GOLDEN_DIFFERS = 'golden-differs';
export const READER_TRAVERSAL_OFF = 'traversal-off';
export const READER_KINDS = [READER_TOKEN_MISSING, READER_GOLDEN_DIFFERS, READER_TRAVERSAL_OFF];
export const READER_TRAVERSAL_WHERE = 'traversal';
/**
 * The fields a finding of each source never carries: a rule naming one could never match.
 */
const NEVER_CARRIED = Object.freeze({
  checks: ['axeIssues'],
  axe: ['causes'],
  docs: ['causes'],
  reader: ['rules', 'causes', 'criteria', 'themes', 'axeIssues'],
  // A site check's finding names no axe rule, needs-review cause or baseline issue.
  ...Object.fromEntries(Object.keys(SITE_SOURCES).map(source => [source, ['rules', 'causes', 'axeIssues']])),
});

const LIST_FIELDS = MATCH_FIELDS.slice(1);
const PATTERN_FIELDS = new Set(['pages', 'where']);
const CLUSTER_FIELDS = new Set(['id', 'title', 'tracker', 'match']);
const CLUSTER_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TRACKER_ID = /^[A-Z][A-Z0-9]*-\d+$/;
const TASK_ID_IN_TEXT = /\b[A-Z][A-Z0-9]*-\d+\b/;
// A generated instance id (`ht_<hex>`, `wt_<hex>`), on its own or inside a class name.
const INSTANCE_HASH = /\b(ht|wt)_[0-9a-f]{6,}/g;
const POSITIONAL_INDEX = /:nth-(child|of-type|last-child|last-of-type)\(\d+\)/g;
const CLASS_TOKEN = /\.([A-Za-z_][\w-]*)/g;

/**
 * A selector, or a step, with what the run decided masked out: a generated instance id becomes
 * `ht_*` (or `wt_*`) wherever it sits, a positional index becomes `:nth-child(n)`, and a volatile class
 * (`VOLATILE_CLASSES` of the axe baseline: a state, a layer, a layout) is dropped. Idempotent.
 *
 * @param {unknown} text The selector or step.
 * @returns {string} The masked text; an empty string for nothing.
 */
export function maskSelector(text) {
  return String(text ?? '')
    .replace(INSTANCE_HASH, '$1_*')
    .replace(POSITIONAL_INDEX, ':nth-$1(n)')
    .replace(CLASS_TOKEN, (whole, name) => (VOLATILE_CLASSES.has(name) ? '' : whole));
}

/**
 * The shape of a finding: what the triage ratchet counts, and what the sample of a night keeps one row of
 * (`lib/__tests__/fixtures/a11y-findings-sample.json`). The theme, the state and the variant are left out, so
 * one defect on three themes is one shape.
 *
 * @param {{source: string, check: string, kind: string, rule?: string|null, cause?: string|null, page: string, where: string}} finding The finding or row.
 * @returns {string} The shape key.
 */
export function findingShape(finding) {
  return [finding.source, finding.check, finding.kind, finding.rule ?? '', finding.cause ?? '', finding.page, finding.where].join('|');
}

/**
 * Why the catalog's `triage` list is not acceptable: one entry per finding shape left in needs-triage, as
 * `findingShape()` writes it, each with the reason it is not sorted into a cluster yet.
 *
 * @param {unknown} triage The catalog's `triage` field.
 * @returns {string[]} The problems.
 */
function triageProblems(triage) {
  if (!Array.isArray(triage)) {
    return ['"triage" must be an array of { "shape", "reason" } entries'];
  }

  const problems = [];
  const shapes = new Set();

  triage.forEach((entry, index) => {
    const where = `triage entry ${index + 1}`;

    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      problems.push(`${where} must be an object with "shape" and "reason"`);

      return;
    }

    const extra = Object.keys(entry).filter(key => key !== 'shape' && key !== 'reason');
    const fields = typeof entry.shape === 'string' ? entry.shape.split('|') : [];

    if (extra.length > 0) {
      problems.push(`${where} has an unknown field "${extra[0]}"`);
    }
    if (fields.length !== 7 || !FINDING_SOURCES.includes(fields[0])) {
      problems.push(`${where} needs a "shape" as findingShape() writes it (source|check|kind|rule|cause|page|where), got ${JSON.stringify(entry.shape)}`);
    } else if (shapes.has(entry.shape)) {
      problems.push(`${where} repeats the shape ${JSON.stringify(entry.shape)}`);
    }
    if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
      problems.push(`${where} needs a "reason": why the shape is neither a known cause nor the reader's own behavior yet`);
    }
    shapes.add(entry.shape);
  });

  return problems;
}

/**
 * Why the catalog document is not acceptable: one line per problem, empty when it is. Run by the tooling
 * test on the committed file and by the collector before it reads a night, so a malformed rule is a
 * refused catalog, never a finding silently sorted.
 *
 * @param {unknown} doc The parsed `issues.json`.
 * @param {object} [known] The ids a rule may name, when the caller can read them: the tooling test passes both,
 * the collector neither.
 * @param {string[]} [known.axeIssues] The issue ids of the axe baseline (`a11y/axe-baseline.json`).
 * @param {string[]} [known.docsIssues] The issue ids of the docs baseline (`a11y/docs/docs-baseline.json`).
 * @param {string[]} [known.readerProjects] The screen reader projects (`playwright.screenreader.config.ts`).
 * @returns {string[]} The problems.
 */
export function validateIssuesCatalog(doc, known = {}) {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    return ['the catalog must be a JSON object with "schema", "triage" (or "triageLimit") and "clusters"'];
  }

  const problems = [];

  if (doc.schema !== ISSUES_SCHEMA) {
    problems.push(`"schema" must be ${ISSUES_SCHEMA}, got ${JSON.stringify(doc.schema)}`);
  }
  if (doc.triage !== undefined) {
    problems.push(...triageProblems(doc.triage));

    if (doc.triageLimit !== undefined) {
      problems.push('"triageLimit" is the length of "triage": give one of them, not both');
    }
  } else if (!Number.isInteger(doc.triageLimit) || doc.triageLimit < 0) {
    problems.push(`"triageLimit" must be the number of sampled findings that need triage (a non-negative integer), got ${JSON.stringify(doc.triageLimit)}`);
  }
  if (!Array.isArray(doc.clusters)) {
    problems.push('"clusters" must be an array');

    return problems;
  }

  const ids = new Set();

  doc.clusters.forEach((cluster, index) => {
    const where = `cluster ${index + 1}`;

    if (cluster === null || typeof cluster !== 'object' || Array.isArray(cluster)) {
      problems.push(`${where} is not an object`);

      return;
    }

    const label = typeof cluster.id === 'string' ? `cluster "${cluster.id}"` : where;

    for (const field of Object.keys(cluster).filter(name => !CLUSTER_FIELDS.has(name))) {
      problems.push(`${label}: unknown field "${field}"; a cluster has id, title, an optional tracker and match`);
    }
    if (typeof cluster.id !== 'string' || !CLUSTER_ID.test(cluster.id)) {
      problems.push(`${where}: "id" must be a kebab-case slug (menu-semantics), got ${JSON.stringify(cluster.id)}`);
    } else if (cluster.id === TRIAGE_ID) {
      problems.push(`${label}: the id is reserved for the findings no cluster matches`);
    } else if (ids.has(cluster.id)) {
      problems.push(`${where}: duplicate cluster id "${cluster.id}"`);
    } else {
      ids.add(cluster.id);
    }
    if (typeof cluster.title !== 'string' || cluster.title.trim() === '') {
      problems.push(`${label}: "title" must say what the problem is`);
    } else if (TASK_ID_IN_TEXT.test(cluster.title)) {
      problems.push(`${label}: the title names a task id; it goes in "tracker". The test-health page and the pull request `
        + 'text print titles, and the ClickUp integration attaches every task id it finds in a pull request');
    }
    if (cluster.tracker !== undefined) {
      const trackers = Array.isArray(cluster.tracker) ? cluster.tracker : [cluster.tracker];

      if (trackers.length === 0 || trackers.some(id => typeof id !== 'string' || !TRACKER_ID.test(id))) {
        problems.push(`${label}: "tracker" is optional, and when present it is a task id (DEV-1234) or a list of them, `
          + `got ${JSON.stringify(cluster.tracker)}`);
      }
    }
    if (!Array.isArray(cluster.match) || cluster.match.length === 0) {
      problems.push(`${label}: no match rule; a cluster needs at least one, or it matches nothing`);

      return;
    }
    cluster.match.forEach((rule, ruleIndex) => validateRule(rule, `${label}, rule ${ruleIndex + 1}`, problems, known));
  });

  return problems;
}

/**
 * The values of a list field outside an allowed list, as one problem.
 *
 * @param {string[]} values The rule's values.
 * @param {Iterable<string>} allowed The allowed values.
 * @param {string} message What the values must be, as a phrase after "names".
 * @returns {string|null} The problem, or `null`.
 */
function outside(values, allowed, message) {
  const set = new Set(allowed);
  const unknown = values.filter(value => !set.has(value));

  return unknown.length > 0 ? `names ${unknown.map(value => JSON.stringify(value)).join(', ')}, ${message}` : null;
}

/**
 * Checks one match rule.
 *
 * @param {unknown} rule The rule.
 * @param {string} label Where it sits.
 * @param {string[]} problems Where a problem goes.
 * @param {{axeIssues?: string[], docsIssues?: string[], readerProjects?: string[]}} known The ids a rule may name, when known.
 */
function validateRule(rule, label, problems, known) {
  if (rule === null || typeof rule !== 'object' || Array.isArray(rule)) {
    problems.push(`${label} is not an object`);

    return;
  }
  for (const field of Object.keys(rule).filter(name => !MATCH_FIELDS.includes(name))) {
    problems.push(`${label}: unknown field "${field}"; a rule has ${MATCH_FIELDS.join(', ')}`);
  }
  if (!FINDING_SOURCES.includes(rule.source)) {
    problems.push(`${label}: "source" must be one of ${FINDING_SOURCES.join(', ')}, got ${JSON.stringify(rule.source)}`);
  }

  const named = LIST_FIELDS.filter(field => rule[field] !== undefined);

  if (named.length === 0) {
    problems.push(`${label}: at least one of ${LIST_FIELDS.join(', ')} must narrow the rule; a source alone matches everything`);
  }
  for (const field of named) {
    const values = rule[field];

    if (!Array.isArray(values) || values.length === 0 || values.some(value => typeof value !== 'string' || value === '')) {
      problems.push(`${label}: "${field}" must be a non-empty list of strings`);
      continue;
    }
    if (PATTERN_FIELDS.has(field)) {
      for (const pattern of values) {
        try {
          // eslint-disable-next-line no-new
          new RegExp(pattern);
        } catch (error) {
          problems.push(`${label}: "${field}" holds ${JSON.stringify(pattern)}, which is not a regular expression (${error.message})`);
        }
      }
    }
    if (FINDING_SOURCES.includes(rule.source) && NEVER_CARRIED[rule.source].includes(field)) {
      problems.push(`${label}: "${field}" on a ${rule.source} rule: a ${rule.source} finding never carries it, so the rule could never match`);
      continue;
    }

    const problem = valuesProblem(field, values, rule.source, known);

    if (problem !== null) {
      problems.push(`${label}: "${field}" ${problem}`);
    }
  }
}

/**
 * The problem with a list field's values against what a finding of the rule's source can carry, or `null`.
 *
 * @param {string} field The field.
 * @param {string[]} values Its values.
 * @param {string} source The rule's source.
 * @param {{axeIssues?: string[], docsIssues?: string[], readerProjects?: string[]}} known The ids a rule may name, when known.
 * @returns {string|null} The problem.
 */
function valuesProblem(field, values, source, known) {
  if (field === 'criteria') {
    return outside(values, Object.keys(WCAG_CRITERIA), 'not a WCAG 2.2 criterion (WCAG_CRITERIA, tests/lib/a11y-evidence.mjs)');
  }
  if (field === 'themes' && source === 'docs') {
    return outside(values, DOCS_THEMES, `not a docs color scheme (${DOCS_THEMES.join(', ')})`);
  }
  if (field === 'themes' && Object.hasOwn(SITE_SOURCES, source)) {
    const themes = SITE_THEMES[SITE_SOURCES[source]];

    return outside(values, themes, `not a ${SITE_SOURCES[source]} color scheme (${themes.join(', ')})`);
  }
  if (field === 'checks' && Object.hasOwn(SITE_SOURCES, source)) {
    return outside(values, Object.keys(siteChecks(SITE_SOURCES[source])), `not a ${SITE_SOURCES[source]} site check (SITE_CHECKS, tests/lib/a11y-site-checks.mjs)`);
  }
  if (field === 'themes') {
    return outside(values, A11Y_THEMES, `not a theme (${A11Y_THEMES.join(', ')})`);
  }
  if (field === 'checks' && source === 'checks') {
    return outside(values, Object.keys(EVIDENCE_CHECKS), 'not a check of EVIDENCE_CHECKS (tests/lib/a11y-evidence.mjs)');
  }
  if (field === 'checks' && source === 'axe') {
    return outside(values, [AXE_SCAN_CHECK], `not the axe scan's check ("${AXE_SCAN_CHECK}")`);
  }
  if (field === 'checks' && source === 'docs') {
    return outside(values, [DOCS_SCAN_CHECK], `not the docs scan's check ("${DOCS_SCAN_CHECK}")`);
  }
  if (field === 'checks' && source === 'reader' && Array.isArray(known.readerProjects)) {
    return outside(values, known.readerProjects, 'not a screen reader project (playwright.screenreader.config.ts)');
  }
  if (field === 'kinds' && (source === 'axe' || source === 'docs')) {
    return outside(values, [AXE_SCAN_KIND], `not the axe scan's kind ("${AXE_SCAN_KIND}")`);
  }
  if (field === 'kinds' && source === 'reader') {
    return outside(values, READER_KINDS, `not a reader kind (${READER_KINDS.join(', ')})`);
  }
  if (field === 'axeIssues' && source === 'docs') {
    return Array.isArray(known.docsIssues)
      ? outside(values, known.docsIssues, 'not an issue of the docs baseline (a11y/docs/docs-baseline.json)')
      : null;
  }
  if (field === 'axeIssues' && Array.isArray(known.axeIssues)) {
    return outside(values, known.axeIssues, 'not an issue of the axe baseline (a11y/axe-baseline.json)');
  }

  return null;
}

/**
 * The catalog with its patterns compiled, ready for `matchClusters()`. Throws on a catalog that does not
 * validate, with every problem in the message.
 *
 * @param {unknown} doc The parsed `issues.json`.
 * @returns {{schema: number, triageLimit: number, triage: Array<{shape: string, reason: string}>, clusters: object[]}}
 * The compiled catalog: the triage limit (the length of `triage`, or the `triageLimit` of a catalog that gives the
 * number alone), the triage entries, and each cluster with its `id`, `title`, `tracker` (a task id, a list of them,
 * or `null`) and `match` rules, whose `pages` and `where` are regular expressions (`pages` anchored to the whole id).
 */
export function compileIssuesCatalog(doc) {
  const problems = validateIssuesCatalog(doc);

  if (problems.length > 0) {
    throw new Error(`tests/${ISSUES_FILE} does not validate: ${problems.join('; ')}`);
  }

  return {
    schema: doc.schema,
    triageLimit: doc.triage === undefined ? doc.triageLimit : doc.triage.length,
    triage: (doc.triage ?? []).map(entry => ({ shape: entry.shape, reason: entry.reason })),
    clusters: doc.clusters.map(cluster => ({
      id: cluster.id,
      title: cluster.title,
      tracker: cluster.tracker ?? null,
      match: cluster.match.map(rule => ({
        ...rule,
        pages: rule.pages?.map(pattern => new RegExp(`^(?:${pattern})$`)),
        where: rule.where?.map(pattern => new RegExp(pattern)),
      })),
    })),
  };
}

/**
 * Whether one rule matches a finding: the source, and every field the rule names.
 *
 * @param {object} rule A compiled rule.
 * @param {object} finding The finding.
 * @returns {boolean} The verdict.
 */
function ruleMatches(rule, finding) {
  const has = (field, value) => rule[field] === undefined || rule[field].includes(value);

  return rule.source === finding.source
    && has('checks', finding.check)
    && has('kinds', finding.kind)
    && has('rules', finding.rule ?? null)
    && has('causes', finding.cause ?? null)
    && has('themes', finding.theme ?? null)
    && has('axeIssues', finding.issue ?? null)
    && (rule.criteria === undefined || (finding.criteria ?? []).some(id => rule.criteria.includes(id)))
    && (rule.pages === undefined || rule.pages.some(pattern => pattern.test(String(finding.page ?? ''))))
    && (rule.where === undefined || rule.where.some(pattern => pattern.test(String(finding.where ?? ''))));
}

/**
 * Every cluster a finding matches, in catalog order. More than one is a catalog error.
 *
 * @param {object} finding The finding: `source`, `check`, `kind`, `rule`, `cause`, `criteria`, `page`, `theme`,
 * `where` (masked) and `issue` (the baseline issue of a known axe finding).
 * @param {{clusters: object[]}} catalog The compiled catalog.
 * @returns {string[]} The cluster ids.
 */
export function matchClusters(finding, catalog) {
  return catalog.clusters.filter(cluster => cluster.match.some(rule => ruleMatches(rule, finding))).map(cluster => cluster.id);
}

/**
 * The cluster a finding belongs to: the first that matches, with its tracker, or `needs-triage`. When
 * more than one matches, `ambiguous` lists them all, so a caller can refuse the catalog or note it.
 *
 * @param {object} finding The finding (`matchClusters()`).
 * @param {{clusters: object[]}} catalog The compiled catalog.
 * @returns {{id: string, tracker: string|string[]|null, ambiguous: string[]}} The verdict.
 */
export function clusterOf(finding, catalog) {
  const matches = matchClusters(finding, catalog);

  if (matches.length === 0) {
    return { id: TRIAGE_ID, tracker: null, ambiguous: [] };
  }

  const cluster = catalog.clusters.find(entry => entry.id === matches[0]);

  return { id: cluster.id, tracker: cluster.tracker, ambiguous: matches.length > 1 ? matches : [] };
}

/**
 * A finding of a check run as the catalog reads it, the way the ledger reads the same finding from the night's
 * artifacts (`.github/scripts/lib/a11y-ledger.mjs`), so a cluster rule matches it at pull request time too.
 *
 * @param {'checks'|'axe'|'reader'|'docs'|'docs-checks'} source The source.
 * @param {string} check The check (`keyboard-walker`, `docs-keyboard`), `axe` for the scan, or the screen reader project.
 * @param {object} item The finding as the run holds it: an evidence finding, an axe comparison item, or
 * `{scenario, step, kind}` for a screen reader step.
 * @returns {object} The finding `clusterOf()` reads.
 */
export function catalogFinding(source, check, item) {
  // The docs site scan's comparison items have the gating scan's shape, under the docs scan's check.
  if (source === 'axe' || source === 'docs') {
    return {
      source, check: source === 'docs' ? DOCS_SCAN_CHECK : AXE_SCAN_CHECK, kind: AXE_SCAN_KIND, rule: item.rule ?? null, cause: null, criteria: [...(item.wcag ?? [])],
      page: item.page, theme: item.theme ?? null, where: maskSelector(item.target), issue: item.issue ?? item.suggestedIssue ?? null,
    };
  }
  if (source === 'reader') {
    return {
      source, check, kind: item.kind ?? READER_TOKEN_MISSING, rule: null, cause: null, criteria: [],
      page: item.scenario, theme: null, where: item.step, issue: null,
    };
  }

  const selector = typeof item.selector === 'string' ? maskSelector(item.selector) : null;
  const step = typeof item.step === 'string' ? item.step : null;

  return {
    source, check, kind: item.kind, rule: item.rule ?? null, cause: item.cause ?? null, criteria: [...(item.criteria ?? [])],
    page: item.page, theme: item.theme ?? null, where: selector !== null && step !== null ? `${selector} @ ${step}` : (selector ?? step ?? ''), issue: null,
  };
}

/**
 * A predicate that says whether a finding's cluster has a tracker: the posters' `tracked` input, which turns
 * tracked debt into a warning on a change run. Without a catalog nothing is tracked, so a catalog that failed to
 * load leaves every finding at its severity.
 *
 * @param {{clusters: object[]}|null} catalog The compiled catalog (`compileIssuesCatalog()`), or `null`.
 * @returns {(source: string, check: string, item: object) => boolean} The predicate.
 */
export function trackedBy(catalog) {
  if (!catalog) {
    return () => false;
  }

  return (source, check, item) => {
    const { tracker } = clusterOf(catalogFinding(source, check, item), catalog);

    return Array.isArray(tracker) ? tracker.length > 0 : Boolean(tracker);
  };
}
