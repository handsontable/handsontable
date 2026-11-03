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
 * gating scan; `reader`: the screen reader lanes) and any of: `checks` (check ids, or reader projects),
 * `kinds`, `rules` (axe rule ids), `causes` (the discovery run's needs-review causes), `criteria` (WCAG
 * ids), `pages` (anchored patterns on the page id, or the reader scenario), `themes`, `where` (patterns
 * searched in the masked selector or step) and `axeIssues` (the baseline issue a known axe finding is
 * filed under). The values of a field are ORed, the fields of a rule ANDed, the rules of a cluster
 * ORed.
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
import { VOLATILE_CLASSES } from './a11y-baseline.mjs';
import { EVIDENCE_CHECKS } from './a11y-evidence.mjs';

export const ISSUES_SCHEMA = 1;
export const ISSUES_FILE = 'a11y/issues.json';
/**
 * The cluster a finding lands in when no rule matches it. Reserved: a catalog cluster cannot take the id.
 */
export const TRIAGE_ID = 'needs-triage';
export const FINDING_SOURCES = ['checks', 'axe', 'reader'];
/**
 * The fields a match rule may carry, `source` first. A rule needs `source` and at least one other.
 */
export const MATCH_FIELDS = ['source', 'checks', 'kinds', 'rules', 'causes', 'criteria', 'pages', 'themes', 'where', 'axeIssues'];

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
 * Why the catalog document is not acceptable: one line per problem, empty when it is. Run by the tooling
 * test on the committed file and by the collector before it reads a night, so a malformed rule is a
 * refused catalog, never a finding silently sorted.
 *
 * @param {unknown} doc The parsed `issues.json`.
 * @returns {string[]} The problems.
 */
export function validateIssuesCatalog(doc) {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    return ['the catalog must be a JSON object with "schema", "triageLimit" and "clusters"'];
  }

  const problems = [];

  if (doc.schema !== ISSUES_SCHEMA) {
    problems.push(`"schema" must be ${ISSUES_SCHEMA}, got ${JSON.stringify(doc.schema)}`);
  }
  if (!Number.isInteger(doc.triageLimit) || doc.triageLimit < 0) {
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
    cluster.match.forEach((rule, ruleIndex) => validateRule(rule, `${label}, rule ${ruleIndex + 1}`, problems));
  });

  return problems;
}

/**
 * Checks one match rule.
 *
 * @param {unknown} rule The rule.
 * @param {string} label Where it sits.
 * @param {string[]} problems Where a problem goes.
 */
function validateRule(rule, label, problems) {
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
    if (field === 'checks' && rule.source === 'checks') {
      for (const check of values.filter(name => !Object.hasOwn(EVIDENCE_CHECKS, name))) {
        problems.push(`${label}: "checks" names ${check}, which is not a check of EVIDENCE_CHECKS (tests/lib/a11y-evidence.mjs)`);
      }
    }
  }
}

/**
 * The catalog with its patterns compiled, ready for `matchClusters()`. Throws on a catalog that does not
 * validate, with every problem in the message.
 *
 * @param {unknown} doc The parsed `issues.json`.
 * @returns {{schema: number, triageLimit: number, clusters: object[]}} The compiled catalog: each cluster with its
 * `id`, `title`, `tracker` (a task id, a list of them, or `null`) and `match` rules, whose `pages` and `where` are
 * regular expressions (`pages` anchored to the whole id).
 */
export function compileIssuesCatalog(doc) {
  const problems = validateIssuesCatalog(doc);

  if (problems.length > 0) {
    throw new Error(`tests/${ISSUES_FILE} does not validate: ${problems.join('; ')}`);
  }

  return {
    schema: doc.schema,
    triageLimit: doc.triageLimit,
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
