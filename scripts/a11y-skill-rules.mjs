/**
 * The accessibility skill's defect classes, checked against everything that names them.
 *
 * `.claude/skills/handsontable-a11y/rules.json` lists the defect classes: the mechanism behind a kind of finding, the
 * rule against it, and the check that enforces the rule and where that check runs. Five other places depend on it,
 * and each can drift on its own:
 *
 * - `references/classes.md`, the same table for a reader, row for row;
 * - the build rules of `SKILL.md`, each tagged with the classes it carries (`[C09]`), within a size budget;
 * - the file that holds the rule of a class whose home is not the skill (`docs`);
 * - `tests/a11y/issues.json`, whose every cluster names its class in `defectClass`, and which the strikes and the
 *   `notPreventable` list name clusters of;
 * - the pointer lines other skills carry (`POINTER_FILES`), which must still point, and name a build rule that exists.
 *
 * What it leaves to review: whether a rule's text is right, whether a pointer line says what the rule says, and whether
 * a cluster's class is the one whose rule would have prevented it.
 *
 * Everything here is pure: `collectSkillProblems()` takes the texts and the parsed documents, so a test can plant a
 * failure in a copy, and `readSkillInputs()` is the one reader of the files. The learning routine reads the same
 * module. The checks this module accepts are the evidence checks and the site checks of `tests/lib` plus the
 * scans and the test tiers; `tests/lib` never reads this folder.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { EVIDENCE_CHECKS, WCAG_CRITERIA } from '../tests/lib/a11y-evidence.mjs';
import { SITE_CHECKS } from '../tests/lib/a11y-site-checks.mjs';
import { AXE_SCAN_CHECK, DOCS_SCAN_CHECK, WEBSITE_SCAN_CHECK } from '../tests/lib/a11y-issues.mjs';

export const SKILL_DIR = '.claude/skills/handsontable-a11y';
export const RULES_FILE = `${SKILL_DIR}/rules.json`;
export const CLASSES_FILE = `${SKILL_DIR}/references/classes.md`;
export const SKILL_FILE = `${SKILL_DIR}/SKILL.md`;
export const CATALOG_FILE = 'tests/a11y/issues.json';
export const RULES_SCHEMA = 1;
/**
 * The size of `SKILL.md`: its lines (as `wc -l` counts them) and the bullets of its "Build rules" section. Pinned
 * here as well as in `rules.json`, so a change that raises the budget edits this file, which the learning routine
 * may not touch.
 */
export const BUDGET = Object.freeze({ skillLines: 120, buildRules: 20 });
export const HOMES = ['skill', 'docs', 'website', 'record-only'];
/**
 * The file that holds the rule text of each home. The website's rules live in its own repository, and a record-only
 * class has none.
 */
export const HOME_FILES = Object.freeze({
  skill: SKILL_FILE,
  docs: 'docs/AGENTS.md',
});
/**
 * The skills that point at the accessibility rules instead of restating them, each with what its pointer names: the
 * skill itself, or the docs section of the `docs` home. A pointer that quotes a build rule by its bold lead
 * (`the \`handsontable-a11y\` skill, "Only the user moves focus"`) must quote one `SKILL.md` has.
 */
export const POINTER_FILES = Object.freeze({
  '.claude/skills/handsontable-celltype-dev/SKILL.md': 'skill',
  '.claude/skills/i18n-translations/SKILL.md': 'skill',
  '.claude/skills/refactoring/SKILL.md': 'skill',
  '.claude/skills/react-wrapper-dev/SKILL.md': 'skill',
  '.claude/skills/vue-wrapper-dev/SKILL.md': 'skill',
  '.claude/skills/angular-wrapper-dev/SKILL.md': 'skill',
  '.claude/skills/walkontable-dev/SKILL.md': 'skill',
  '.claude/skills/visual-testing/SKILL.md': 'skill',
  '.claude/skills/creating-docs-examples/SKILL.md': 'docs',
  '.claude/skills/writing-docs-pages/SKILL.md': 'docs',
});
const POINTER_TARGETS = Object.freeze({
  skill: { text: '`handsontable-a11y` skill', says: 'the `handsontable-a11y` skill' },
  docs: { text: '`docs/AGENTS.md`, "Accessible pages"', says: '`docs/AGENTS.md`, "Accessible pages"' },
});
const QUOTED_RULE = /`handsontable-a11y` skill, "([^"]+)"/g;
const RULE_LEAD = /^- \*\*([^*]+?)\.?\*\*/;
const RUNS_TEXT = Object.freeze({ 'pull-request': 'pull request', weekly: 'weekly', none: 'nowhere yet' });
const TOP_FIELDS = ['schema', 'about', 'budget', 'classes', 'notPreventable'];
const CLASS_FIELDS = ['id', 'name', 'wcag', 'home', 'rule', 'enforcedBy', 'strikes'];
const CHECK_FIELDS = ['check', 'runs', 'note'];
const CLASS_ID = /^C\d{2}$/;
const CLUSTER_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TAG = /\[(C\d{2}(?:, C\d{2})*)\]/g;
// The catalog's own test for a task id in text (`TASK_ID_IN_TEXT` of tests/lib/a11y-issues.mjs), and a date.
const TASK_ID_IN_TEXT = /\b[A-Z][A-Z0-9]*-\d+\b/;
const DATE_IN_TEXT = /\b\d{4}-\d{2}-\d{2}\b/;
const WHY = 'a rule says what to do and why';

/**
 * Every check a class may name, with where it can run. A pull request runs the axe scan and the short suite of the
 * checks beyond axe, the ones with `pullRequest: true` in `EVIDENCE_CHECKS`, both report-only (the short suite
 * against the findings ledger), and the functional tier; the other checks beyond axe run in the weekly audit only.
 * The flag decides, so a check that joins or leaves the short suite changes what its classes must say, and this test
 * fails until `rules.json` follows. A site check reads a deployed site, and the docs and website scans run on a pull
 * request only for their own tooling, so both are weekly.
 *
 * @returns {Map<string, string[]>} The check ids, each with the values of `runs` it allows.
 */
export function knownChecks() {
  const weekly = ['weekly', 'none'];
  const evidenceRuns = check => (check.pullRequest === true ? ['pull-request'] : weekly);

  return new Map([
    ...Object.entries(EVIDENCE_CHECKS).map(([id, check]) => [id, evidenceRuns(check)]),
    ...Object.keys(SITE_CHECKS).map(id => [id, weekly]),
    [AXE_SCAN_CHECK, ['pull-request']],
    [DOCS_SCAN_CHECK, weekly],
    [WEBSITE_SCAN_CHECK, weekly],
    ['unit', ['pull-request']],
    ['e2e', ['pull-request']],
    ['readers', weekly],
    ['none', ['none']],
  ]);
}

/**
 * One check of a class as the class table writes it: the id and where it runs, with the note.
 *
 * @param {{check: string, runs: string, note?: string}} entry The entry of `enforcedBy`.
 * @returns {string} The text.
 */
function enforcedByText({ check, runs, note }) {
  return check === 'none' ? 'none' : `\`${check}\` (${[RUNS_TEXT[runs], note].filter(Boolean).join('; ')})`;
}

/**
 * A class as its row of `references/classes.md` reads: the twin the class table must hold, character for character.
 *
 * @param {object} entry The class (`id`, `name`, `wcag`, `home`, `rule`, `enforcedBy`, `strikes`).
 * @returns {string} The table row.
 */
export function classRow(entry) {
  const wcag = entry.wcag.length > 0 ? entry.wcag.join(', ') : 'none';
  const rule = entry.rule ?? 'none: recorded, never prevented';
  const enforced = entry.enforcedBy.map(enforcedByText).join(', ');

  return `| ${entry.id} | ${entry.name} | ${wcag} | ${entry.home} | ${rule} | ${enforced} | ${entry.strikes.length} |`;
}

/**
 * The bullets of a markdown section, each with its continuation lines joined: what `SKILL.md` calls its build
 * rules.
 *
 * @param {string} text The markdown.
 * @param {string} heading The section's heading line.
 * @returns {string[]|null} The bullets, or `null` when the section is missing.
 */
export function sectionBullets(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => line.trim() === heading);

  if (start === -1) {
    return null;
  }

  const bullets = [];

  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2} /.test(line)) {
      break;
    }
    if (line.startsWith('- ')) {
      bullets.push(line);
    } else if (bullets.length > 0 && /^\s+\S/.test(line)) {
      bullets[bullets.length - 1] += ` ${line.trim()}`;
    }
  }

  return bullets;
}

/**
 * The class ids a text tags, as `[C09]` or `[C06, C09]`.
 *
 * @param {string} text The text.
 * @returns {string[]} The ids, in order, repeats kept.
 */
export function classTags(text) {
  return [...text.matchAll(TAG)].flatMap(([, list]) => list.split(', '));
}

/**
 * The number of lines of a text as `wc -l` counts them.
 *
 * @param {string} text The text.
 * @returns {number} The count.
 */
export function lineCount(text) {
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

/**
 * The fields of an object outside an allowed list, one problem each.
 *
 * @param {object} entry The object.
 * @param {string[]} allowed The allowed fields.
 * @param {string} label Where it sits.
 * @returns {string[]} The problems.
 */
function unknownFields(entry, allowed, label) {
  return Object.keys(entry).filter(key => !allowed.includes(key)).map(key => `${label} has an unknown field "${key}"`);
}

/**
 * Whether a value is text a table cell can hold: not empty, and with no pipe, which would split the cell.
 *
 * @param {unknown} value The value.
 * @returns {boolean} The verdict.
 */
function isCellText(value) {
  return typeof value === 'string' && value.trim() !== '' && !value.includes('|');
}

/**
 * Why one entry of `enforcedBy` is not acceptable.
 *
 * @param {unknown} entry The entry.
 * @param {string} label Where it sits.
 * @param {Map<string, string[]>} checks The known checks (`knownChecks()`).
 * @returns {string[]} The problems.
 */
function enforcedByProblems(entry, label, checks) {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return [`${label} is not an object with "check" and "runs"`];
  }

  const problems = unknownFields(entry, CHECK_FIELDS, label);

  if (!checks.has(entry.check)) {
    const others = [...checks.keys()]
      .filter(id => !Object.hasOwn(EVIDENCE_CHECKS, id) && !Object.hasOwn(SITE_CHECKS, id));

    problems.push(`${label} names ${JSON.stringify(entry.check)}, which is not a known check: an id of EVIDENCE_CHECKS `
      + `or SITE_CHECKS (tests/lib), or one of ${others.join(', ')}`);
  } else if (!checks.get(entry.check).includes(entry.runs)) {
    problems.push(`${label}: "${entry.check}" runs ${checks.get(entry.check).join(' or ')}, not `
      + `${JSON.stringify(entry.runs)} (knownChecks() in scripts/a11y-skill-rules.mjs says where each check runs)`);
  }
  if (entry.note !== undefined && !isCellText(entry.note)) {
    problems.push(`${label}: "note" is optional, and when present it is text with no pipe (the class table would `
      + 'split on it)');
  }

  return problems;
}

/**
 * Why one strike or one `notPreventable` entry is not acceptable.
 *
 * @param {unknown} entry The entry.
 * @param {string} label Where it sits.
 * @param {object} shape The fields, each with its test and what it must be.
 * @returns {string[]} The problems.
 */
function recordProblems(entry, label, shape) {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return [`${label} is not an object with ${Object.keys(shape).join(', ')}`];
  }

  const problems = unknownFields(entry, Object.keys(shape), label);

  for (const [field, [isValid, says]] of Object.entries(shape)) {
    if (!isValid(entry[field])) {
      problems.push(`${label}: "${field}" must be ${says}, got ${JSON.stringify(entry[field])}`);
    }
  }

  return problems;
}

const isClusterId = value => typeof value === 'string' && CLUSTER_ID.test(value);
const STRIKE_SHAPE = Object.freeze({
  cluster: [isClusterId, 'the cluster id the finding landed in'],
  audit: [
    value => typeof value === 'string' && ISO_DATE.test(value), 'the date of the audit that found it (YYYY-MM-DD)',
  ],
  pullRequest: [value => Number.isInteger(value) && value > 0, 'the number of the pull request that shipped it'],
});
const NOT_PREVENTABLE_SHAPE = Object.freeze({
  cluster: [isClusterId, 'a cluster id'],
  reason: [value => typeof value === 'string' && value.trim() !== '', 'why no rule can prevent it'],
});

/**
 * Why the `enforcedBy` list of a class is not acceptable.
 *
 * @param {unknown} list The list.
 * @param {string} label The class.
 * @param {Map<string, string[]>} checks The known checks.
 * @returns {string[]} The problems.
 */
function enforcedByListProblems(list, label, checks) {
  if (!Array.isArray(list) || list.length === 0) {
    return [`${label}: "enforcedBy" must list at least one check, or { "check": "none", "runs": "none" }`];
  }

  const problems = list.flatMap((item, index) => enforcedByProblems(item, `${label}, enforcedBy ${index + 1}`, checks));

  if (list.length > 1 && list.some(item => item?.check === 'none')) {
    problems.push(`${label}: "none" says no check enforces the rule, so it stands alone in "enforcedBy"`);
  }

  return problems;
}

/**
 * Why one class of `rules.json` is not acceptable.
 *
 * @param {object} entry The class.
 * @param {string} label Where it sits.
 * @param {Map<string, string[]>} checks The known checks.
 * @returns {string[]} The problems.
 */
function classProblems(entry, label, checks) {
  const problems = unknownFields(entry, CLASS_FIELDS, label);

  if (!isCellText(entry.name)) {
    problems.push(`${label}: "name" must say what the class is, with no pipe (the class table would split on it)`);
  }
  if (!Array.isArray(entry.wcag) || entry.wcag.some(id => !Object.hasOwn(WCAG_CRITERIA, id))) {
    problems.push(`${label}: "wcag" must list WCAG 2.2 criteria (WCAG_CRITERIA, tests/lib/a11y-evidence.mjs), `
      + `got ${JSON.stringify(entry.wcag)}`);
  }
  if (!HOMES.includes(entry.home)) {
    problems.push(`${label}: "home" must be one of ${HOMES.join(', ')}, got ${JSON.stringify(entry.home)}`);
  }
  if (entry.home === 'record-only' && entry.rule !== null) {
    problems.push(`${label} is record-only, so its "rule" is null: no rule prevents what it records`);
  } else if (entry.home !== 'record-only' && !isCellText(entry.rule)) {
    problems.push(`${label} has no rule and is not record-only: write the rule, with no pipe, or make the class `
      + 'record-only');
  }
  problems.push(...enforcedByListProblems(entry.enforcedBy, label, checks));

  if (!Array.isArray(entry.strikes)) {
    problems.push(`${label}: "strikes" must be a list, empty until a finding breaks the rule`);
  } else {
    entry.strikes.forEach((strike, index) => {
      problems.push(...recordProblems(strike, `${label}, strike ${index + 1}`, STRIKE_SHAPE));
    });
  }

  return problems;
}

/**
 * Why `rules.json` is not acceptable on its own.
 *
 * @param {unknown} rules The parsed `rules.json`.
 * @returns {string[]} The problems.
 */
export function rulesProblems(rules) {
  if (rules === null || typeof rules !== 'object' || Array.isArray(rules)) {
    return [`${RULES_FILE} must be a JSON object with "schema", "budget", "classes" and "notPreventable"`];
  }

  const problems = unknownFields(rules, TOP_FIELDS, RULES_FILE);
  const checks = knownChecks();

  if (rules.schema !== RULES_SCHEMA) {
    problems.push(`${RULES_FILE}: "schema" must be ${RULES_SCHEMA}, got ${JSON.stringify(rules.schema)}`);
  }
  if (rules.budget?.skillLines !== BUDGET.skillLines || rules.budget?.buildRules !== BUDGET.buildRules
    || Object.keys(rules.budget ?? {}).length !== 2) {
    problems.push(`${RULES_FILE}: "budget" must be ${JSON.stringify(BUDGET)}, got ${JSON.stringify(rules.budget)}: `
      + 'a change to the budget changes BUDGET in scripts/a11y-skill-rules.mjs too, in a change a person reviews');
  }
  if (!Array.isArray(rules.notPreventable)) {
    problems.push(`${RULES_FILE}: "notPreventable" must be a list, of { "cluster", "reason" }`);
  } else {
    rules.notPreventable.forEach((entry, index) => {
      problems.push(...recordProblems(entry, `notPreventable ${index + 1}`, NOT_PREVENTABLE_SHAPE));
    });
  }
  if (!Array.isArray(rules.classes) || rules.classes.length === 0) {
    problems.push(`${RULES_FILE}: "classes" must be a non-empty list`);

    return problems;
  }

  const ids = new Set();

  rules.classes.forEach((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      problems.push(`class ${index + 1} is not an object`);

      return;
    }

    const label = CLASS_ID.test(entry.id) ? `class ${entry.id}` : `class ${index + 1}`;

    if (!CLASS_ID.test(entry.id)) {
      problems.push(`${label}: "id" must be C and two digits (C09), got ${JSON.stringify(entry.id)}`);
    } else if (ids.has(entry.id)) {
      problems.push(`${label}: the id is used twice`);
    }
    ids.add(entry.id);
    problems.push(...classProblems(entry, label, checks));
  });

  return problems;
}

/**
 * Why the tags of the build rules do not cover the classes of the skill: a rule that names no class, a tag that is
 * not a class of the skill, or a class of the skill no rule names.
 *
 * @param {string[]} bullets The build rules.
 * @param {object[]} classes The classes of `rules.json`.
 * @returns {string[]} The problems.
 */
function tagProblems(bullets, classes) {
  const skillClasses = new Set(classes.filter(entry => entry.home === 'skill').map(entry => entry.id));
  const tagged = new Set();
  const problems = [];

  for (const bullet of bullets) {
    const tags = classTags(bullet);
    const rule = `the build rule "${bullet.slice(2, 60)}…"`;

    if (tags.length === 0) {
      problems.push(`${SKILL_FILE}: ${rule} names no class: end it with its class ids, as [C09]`);
    }
    for (const id of tags.filter(tag => !skillClasses.has(tag))) {
      problems.push(`${SKILL_FILE}: ${rule} names ${id}, which is not a class whose home is the skill in `
        + `${RULES_FILE}`);
    }
    tags.forEach(id => tagged.add(id));
  }
  for (const id of [...skillClasses].filter(classId => !tagged.has(classId))) {
    problems.push(`${SKILL_FILE}: no build rule names ${id}, a class whose home is the skill: tag the rule that `
      + 'carries it');
  }

  return problems;
}

/**
 * Why `SKILL.md` breaks its budget or its tags: too many lines, too many build rules, or the tags of `tagProblems()`.
 *
 * @param {string} skill The text of `SKILL.md`.
 * @param {object[]} classes The classes of `rules.json`.
 * @returns {string[]} The problems.
 */
export function skillProblems(skill, classes) {
  const problems = [];
  const lines = lineCount(skill);
  const bullets = sectionBullets(skill, '## Build rules');

  if (lines > BUDGET.skillLines) {
    problems.push(`${SKILL_FILE} has ${lines} lines, over the budget of ${BUDGET.skillLines}: shorten a rule, or move `
      + 'detail into references/, never raise the budget to fit');
  }
  if (bullets === null) {
    return [...problems, `${SKILL_FILE} has no "## Build rules" section`];
  }
  if (bullets.length > BUDGET.buildRules) {
    problems.push(`${SKILL_FILE} has ${bullets.length} build rules, over the budget of ${BUDGET.buildRules}: a rule `
      + 'broken twice becomes a check, and its prose shrinks to a pointer');
  }

  return [...problems, ...tagProblems(bullets, classes)];
}

/**
 * Why a class whose rule lives outside the skill (`docs`) is not named in the file that holds it.
 *
 * @param {Record<string, string>} texts The text of each home file, by home.
 * @param {object[]} classes The classes of `rules.json`.
 * @returns {string[]} The problems.
 */
export function homeProblems(texts, classes) {
  return classes
    .filter(entry => entry.home !== 'skill' && Object.hasOwn(HOME_FILES, entry.home))
    .filter(entry => !classTags(texts[entry.home] ?? '').includes(entry.id))
    .map(entry => `${HOME_FILES[entry.home]} does not name ${entry.id}, a class whose home is "${entry.home}": `
      + `tag the rule it holds, as [${entry.id}]`);
}

/**
 * Why `references/classes.md` is not the twin of `rules.json`: a class missing from either, a class with two rows, or a
 * row that differs.
 *
 * @param {string} doc The text of `references/classes.md`.
 * @param {object[]} classes The classes of `rules.json`.
 * @returns {string[]} The problems.
 */
export function classesDocProblems(doc, classes) {
  const lines = doc.split('\n').filter(line => /^\| C\d{2} \|/.test(line));
  const rows = new Map(lines.map(line => [line.slice(2, 5), line]));
  const problems = [...rows.keys()]
    .filter(id => lines.filter(line => line.slice(2, 5) === id).length > 1)
    .map(id => `${CLASSES_FILE} has more than one row for ${id}: keep the one ${RULES_FILE} gives`);

  for (const entry of classes) {
    const expected = classRow(entry);

    if (!rows.has(entry.id)) {
      problems.push(`${CLASSES_FILE} has no row for ${entry.id}, which ${RULES_FILE} lists: add\n${expected}`);
    } else if (rows.get(entry.id) !== expected) {
      problems.push(`${CLASSES_FILE}: the row of ${entry.id} differs from ${RULES_FILE}; it reads\n${expected}`);
    }
  }
  for (const id of rows.keys()) {
    if (!classes.some(entry => entry.id === id)) {
      problems.push(`${CLASSES_FILE} has a row for ${id}, which ${RULES_FILE} does not list`);
    }
  }

  return problems;
}

/**
 * Why one cluster of the catalog does not map onto the classes.
 *
 * @param {object} cluster The cluster.
 * @param {Map<string, object>} byId The classes of `rules.json`, by id.
 * @returns {string|null} The problem, or `null`.
 */
function clusterProblem(cluster, byId) {
  const entry = byId.get(cluster.defectClass);
  const where = `${CATALOG_FILE}: cluster "${cluster.id}"`;

  if (cluster.defectClass === undefined) {
    return `${where} has no "defectClass": pick its class in ${CLASSES_FILE}`;
  }
  if (!entry) {
    return `${where} names the class ${JSON.stringify(cluster.defectClass)}, which ${RULES_FILE} does not list`;
  }
  if (cluster.notDefect !== undefined && entry.home !== 'record-only') {
    return `${where} is not a defect (notDefect), so its class is a record-only one, not ${entry.id}`;
  }
  if (cluster.notDefect === undefined && entry.home === 'record-only') {
    return `${where} names the record-only class ${entry.id}, which is for a cluster with notDefect`;
  }

  return null;
}

/**
 * Why the cluster catalog does not map onto the classes: a cluster with no `defectClass`, one the skill does not
 * list, or a record-only class on a defect cluster (or a defect class on a cluster with `notDefect`).
 *
 * @param {{clusters?: object[]}} catalog The parsed `tests/a11y/issues.json`.
 * @param {object[]} classes The classes of `rules.json`.
 * @returns {string[]} The problems.
 */
export function catalogProblems(catalog, classes) {
  const byId = new Map(classes.map(entry => [entry.id, entry]));

  return (catalog.clusters ?? []).map(cluster => clusterProblem(cluster, byId)).filter(Boolean);
}

/**
 * The check a cluster's match is found by, as a class names it: the grid's axe scan, the docs or website axe scan, the
 * screen reader lanes, or the checks it lists (any one of them will do). `null` when the match names no check this
 * module can tell: a site check matched by its kind alone, or the triage run, which enforces nothing.
 *
 * @param {object} match One entry of a cluster's `match`.
 * @returns {string[]|null} The checks, any of which the class must list.
 */
function checksOfMatch(match) {
  const scans = { axe: AXE_SCAN_CHECK, docs: DOCS_SCAN_CHECK, website: WEBSITE_SCAN_CHECK };

  if (Object.hasOwn(scans, match.source)) {
    return [scans[match.source]];
  }
  if (match.source === 'reader') {
    return ['readers'];
  }

  const named = (match.checks ?? []).filter(id => EVIDENCE_CHECKS[id]?.triage !== true);

  return named.length > 0 ? named : null;
}

/**
 * Why the classes do not account for the catalog: a class that leaves out a check one of its clusters is found by, a
 * strike or a `notPreventable` entry that names no cluster of the catalog, or a strike on a cluster of another class.
 *
 * @param {{clusters?: object[]}} catalog The parsed `tests/a11y/issues.json`.
 * @param {object[]} classes The classes of `rules.json`.
 * @param {unknown} notPreventable The `notPreventable` list of `rules.json`.
 * @returns {string[]} The problems.
 */
export function catalogReferenceProblems(catalog, classes, notPreventable) {
  const clusters = new Map((catalog.clusters ?? []).map(cluster => [cluster.id, cluster]));
  const byId = new Map(classes.map(entry => [entry.id, entry]));
  const problems = [];

  for (const cluster of clusters.values()) {
    const entry = byId.get(cluster.defectClass);

    if (!entry || entry.home === 'record-only') {
      continue;
    }

    const listed = new Set(entry.enforcedBy.map(item => item?.check));
    const missing = new Set((cluster.match ?? []).map(checksOfMatch)
      .filter(checks => checks && !checks.some(id => listed.has(id))).map(checks => checks.join(' or ')));

    for (const checks of missing) {
      problems.push(`class ${entry.id}: its cluster "${cluster.id}" is found by ${checks}, which its "enforcedBy" `
        + 'does not list');
    }
  }
  for (const entry of classes) {
    entry.strikes.forEach((strike, index) => {
      const cluster = clusters.get(strike?.cluster);

      if (isClusterId(strike?.cluster) && !cluster) {
        problems.push(`class ${entry.id}, strike ${index + 1} names "${strike.cluster}", which ${CATALOG_FILE} does `
          + 'not hold');
      } else if (cluster && cluster.defectClass !== entry.id) {
        problems.push(`class ${entry.id}, strike ${index + 1} names "${strike.cluster}", a cluster of `
          + `${cluster.defectClass}: a strike counts against the class of its cluster`);
      }
    });
  }
  (Array.isArray(notPreventable) ? notPreventable : []).forEach((item, index) => {
    if (isClusterId(item?.cluster) && !clusters.has(item.cluster)) {
      problems.push(`notPreventable ${index + 1} names "${item.cluster}", which ${CATALOG_FILE} does not hold`);
    }
  });

  return problems;
}

/**
 * Why a pointer line no longer points: a pointer file that names neither the skill nor the docs section it should, or
 * a quoted build rule `SKILL.md` does not have.
 *
 * @param {Record<string, string>} pointers The text of each pointer file, by path.
 * @param {string} skill The text of `SKILL.md`.
 * @returns {string[]} The problems.
 */
export function pointerProblems(pointers, skill) {
  const leads = (sectionBullets(skill, '## Build rules') ?? [])
    .map(bullet => bullet.match(RULE_LEAD)?.[1]).filter(Boolean);
  const problems = [];

  for (const [file, target] of Object.entries(POINTER_FILES)) {
    const text = pointers[file] ?? '';

    if (!text.includes(POINTER_TARGETS[target].text)) {
      problems.push(`${file} does not point at ${POINTER_TARGETS[target].says}: keep its one pointer line`);
    }
    for (const [, quoted] of text.matchAll(QUOTED_RULE)) {
      if (!leads.includes(quoted)) {
        problems.push(`${file} quotes the build rule "${quoted}", which ${SKILL_FILE} does not have: quote a rule's `
          + 'bold lead as it reads');
      }
    }
  }

  return problems;
}

/**
 * Why a text the learning routine may write holds a record rather than a rule: a task id or a date. Counts and ids
 * belong in the pull request that changes the rule.
 *
 * @param {string} text The text.
 * @param {string} file Its path.
 * @returns {string[]} The problems.
 */
export function recordInTextProblems(text, file) {
  return text.split('\n').flatMap((line, index) => {
    const taskId = line.match(TASK_ID_IN_TEXT)?.[0];
    const date = line.match(DATE_IN_TEXT)?.[0];

    return [
      ...(taskId ? [`${file}:${index + 1} names a task id (${taskId}): ${WHY}`] : []),
      ...(date ? [`${file}:${index + 1} holds a date (${date}): ${WHY}`] : []),
    ];
  });
}

/**
 * Every problem of the skill's classes against the files that name them. Empty when everything agrees.
 *
 * @param {object} inputs The inputs (`readSkillInputs()`).
 * @param {unknown} inputs.rules The parsed `rules.json`.
 * @param {string} inputs.skill The text of `SKILL.md`.
 * @param {string} inputs.classesDoc The text of `references/classes.md`.
 * @param {Record<string, string>} inputs.homes The text of each home file, by home.
 * @param {object} inputs.catalog The parsed `tests/a11y/issues.json`.
 * @param {Record<string, string>} inputs.pointers The text of each pointer file, by path.
 * @returns {string[]} The problems.
 */
export function collectSkillProblems({ rules, skill, classesDoc, homes, catalog, pointers }) {
  // The checks after the first read only the classes whose lists are lists, so a malformed class is reported once.
  const classes = (Array.isArray(rules?.classes) ? rules.classes : [])
    .filter(entry => entry && typeof entry === 'object' && Array.isArray(entry.wcag)
      && Array.isArray(entry.enforcedBy) && Array.isArray(entry.strikes));

  return [
    ...rulesProblems(rules),
    ...skillProblems(skill, classes),
    ...homeProblems(homes, classes),
    ...classesDocProblems(classesDoc, classes),
    ...catalogProblems(catalog, classes),
    ...catalogReferenceProblems(catalog, classes, rules?.notPreventable),
    ...pointerProblems(pointers ?? {}, skill),
    ...recordInTextProblems(skill, SKILL_FILE),
    ...recordInTextProblems(classesDoc, CLASSES_FILE),
  ];
}

/**
 * Reads the inputs of `collectSkillProblems()` from a checkout.
 *
 * @param {string} root The repository root.
 * @returns {object} The inputs: `rules`, `skill`, `classesDoc`, `homes`, `catalog` and `pointers`.
 */
export function readSkillInputs(root) {
  const read = file => readFileSync(path.join(root, file), 'utf8');

  return {
    rules: JSON.parse(read(RULES_FILE)),
    skill: read(SKILL_FILE),
    classesDoc: read(CLASSES_FILE),
    homes: Object.fromEntries(Object.entries(HOME_FILES).map(([home, file]) => [home, read(file)])),
    catalog: JSON.parse(read(CATALOG_FILE)),
    pointers: Object.fromEntries(Object.keys(POINTER_FILES).map(file => [file, read(file)])),
  };
}
