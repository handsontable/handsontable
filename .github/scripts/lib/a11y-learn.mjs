/**
 * The accessibility learning routine: the pure half.
 *
 * Every weekly audit adds rows to the findings ledger (`./a11y-ledger.mjs`, `test-health/a11y.json` on `gh-pages`).
 * Most new rows say nothing about the code merged that week: a page, a check or a scenario was added and read what
 * was already there. This module takes the rows that are new in the latest audit of each source and sorts each one,
 * with no judgment, into what a person or an agent can learn from and what they cannot:
 *
 * - `newly-measured`: the previous audit had not looked there (the source's first audit, a new page, check, target,
 *   scenario or step), or the same finding moved to a new selector. Dropped and counted.
 * - `inherited`: newly measured, and the same defect was already open on another page before this audit. Dropped
 *   and counted.
 * - `not-a-defect` and `needs-triage`: the catalog says the cluster is no defect, or no cluster matches yet. Set
 *   aside and counted: the catalog owns them.
 * - `not-on-changed-code`: the previous audit measured the target, and no pull request between the two audited
 *   commits touched the source behind the page. Set aside and counted.
 * - `attributable`: what is left. The previous audit measured the target and found nothing, and at least one pull
 *   request in the range changed the page's own source (`page` tier) or the code every page shares (`shared` tier).
 *   Grouped by cluster and page, each group with its candidate pull requests and its defect class and rule.
 *
 * The agent step (`.claude/skills/handsontable-a11y-learn/SKILL.md`) sorts only the attributable groups, into a rule
 * that existed and was broken, no rule, or not preventable.
 *
 * The rules that keep it honest:
 *
 * - It refuses to speak unless every audit source has a night inside the window with no problem recorded
 *   (`refusalsOf()`): a missed or half-measured audit teaches nothing.
 * - A finding is tied to code by rule, page and cause, never by its selector alone: a row whose twin (the same
 *   check, kind, rule, cause and target, another selector) was resolved the same night is a re-key, not a defect.
 * - What the previous audit measured comes from that night's own coverage (`nightMeasured()`), which only the
 *   published state of that time keeps. Where it is not known, nothing is sorted and the run is refused.
 * - A candidate is a pull request that touched the surface, not a verdict: the packet lists every one, and the agent
 *   reads the diffs.
 * - No task id leaves this module. A cluster is `tracked` or not, and a pull request title loses the ids it names:
 *   the ClickUp integration attaches every id it finds in a pull request, and the packet is where the routine's
 *   pull request text comes from.
 *
 * No I/O in here. `../a11y-learn.mjs` reads the ledger and git, and writes the packet.
 */

import { NIGHT_SOURCES, SOURCES_OF_WORKFLOW, migrateA11yLedger, nightMeasured, nightSourceOf } from './a11y-ledger.mjs';
import { escapeMarkdownText } from '../../../tests/lib/a11y-baseline.mjs';
import { TRIAGE_ID, clusterOf } from '../../../tests/lib/a11y-issues.mjs';

/**
 * The packet's version.
 */
export const LEARN_SCHEMA = 1;
/**
 * How old the latest night of a source may be for the routine to run, in hours.
 */
export const LEARN_MAX_AGE_HOURS = 24;
/**
 * The folder the routine's pull request may change freely: the accessibility skill, its references and `rules.json`.
 */
export const LEARN_SKILL_DIR = '.claude/skills/handsontable-a11y/';
export const LEARN_RULES_FILE = `${LEARN_SKILL_DIR}rules.json`;
/**
 * The cluster catalog, and the only fields of a cluster the routine's pull request may change.
 */
export const LEARN_CATALOG_FILE = 'tests/a11y/issues.json';
export const LEARN_CATALOG_FIELDS = Object.freeze(['defectClass', 'notDefect']);
/**
 * The sorted outcomes of a new row, in the order the packet counts them.
 */
export const LEARN_OUTCOMES = Object.freeze(['attributable', 'inherited', 'newly-measured', 'not-on-changed-code', 'not-a-defect', 'needs-triage',
  'unsorted']);
/**
 * Why a row is newly measured.
 */
export const NEWLY_MEASURED_REASONS = Object.freeze(['first-audit', 'page', 'check', 'target', 'step', 'selector']);
/**
 * How many pull requests, elements and reasons a group lists before it only counts the rest.
 */
export const LEARN_LISTED = Object.freeze({ candidates: 12, files: 6, elements: 12, reasons: 3, dropped: 20 });

const HOUR_MS = 60 * 60 * 1000;
// A ClickUp custom id (`DEV-458`), as `tests/lib/a11y-issues.mjs` reads one in a title, and also where an underscore
// follows it, as in a branch name (`feature/DEV-458_Short-Description`).
const TASK_ID = /(?<![A-Za-z0-9])[A-Z][A-Z0-9]*-\d+(?![A-Za-z0-9])/g;
// What is shaped like a task id and is none: a character set, a standard, a hash, a time zone offset. A list of what
// to let through, never of the prefixes to catch: a prefix this file does not know is attached to the pull request
// for good, and a name it wrongly catches only costs a rewording.
const NOT_TASK_PREFIXES = new Set(['UTF', 'UCS', 'ISO', 'IEC', 'RFC', 'CVE', 'CWE', 'SHA', 'MD', 'UTC', 'GMT']);

/**
 * Whether a token shaped like a task id is one.
 *
 * @param {string} token The token (`DEV-458`, `UTF-8`).
 * @returns {boolean} The verdict.
 */
function isTaskId(token) {
  return !NOT_TASK_PREFIXES.has(token.slice(0, token.lastIndexOf('-')));
}
const PULL_REQUEST = /\(#(\d+)\)\s*$/;
const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'minor', 'advisory'];
const READER_SOURCE = 'reader';
// The night sources that audit the grid, whose findings and pull requests the packet's rate counts.
const GRID_SOURCES = Object.freeze(['a11y', 'reader']);
// The row sources that scan whole pages with axe, whose night says only that the scan was complete.
const SCAN_SOURCES = new Set(['axe', 'docs', 'website']);
const REGULAR_FILE = '100644';
const NO_FILE = '000000';

/**
 * The code behind each night source's pages, for `surfaceOf()`.
 *
 * - `owned` matches a path that belongs to one feature (a plugin's or an editor's folder, or its style partial): it is
 *   part of a page's surface only when the maps list it for the page.
 * - `shared` lists the prefixes every page of the source draws from.
 * - `notProduct` matches what changes no page: tests, type tests and agent notes.
 *
 * The website has no entry: its code is in another repository, so no commit here can be tied to a finding on it.
 */
// A path that belongs to one plugin or editor: its folder, or its style partial (`_formula-builder.scss`).
const GRID_OWNED = /^handsontable\/src\/(?:(?:plugins|editors)\/(?!base(?:Editor)?\/)[^/]+\/|styles\/components\/(?:plugins|editors)\/_[^/]+\.scss$)/;
// What changes nothing a grid page draws: tests, type declarations, agent notes and the generated feature manifest.
const GRID_NOT_PRODUCT = /(?:^|\/)(?:__tests__|test)\/|\.(?:spec|unit|test|types)\.[cm]?[jt]sx?$|\.d\.ts$|\.md$|(?:^|\/)feature(?:s)?\.(?:json|generated\.ts)$/;
const SURFACES = Object.freeze({
  a11y: Object.freeze({ owned: GRID_OWNED, shared: Object.freeze(['handsontable/src/']), notProduct: GRID_NOT_PRODUCT }),
  reader: Object.freeze({ owned: GRID_OWNED, shared: Object.freeze(['handsontable/src/']), notProduct: GRID_NOT_PRODUCT }),
  docs: Object.freeze({
    owned: /^docs\/content\/guides\//,
    shared: Object.freeze(['docs/src/', 'docs/public/', 'docs/astro.config.mjs']),
    notProduct: /^docs\/tests\//,
  }),
});

/**
 * @typedef {object} Commit A first-parent commit of the range between two audited commits.
 * @property {string} sha The commit.
 * @property {number|null} pullRequest The pull request its subject names (`(#14270)`), or `null`.
 * @property {string} title The subject, with no pull request suffix and no task id.
 * @property {string[]} files The paths it changed against its first parent.
 */

/**
 * @typedef {object} SurfaceMaps What the repository says about where a page's code lives. The script builds it from
 * `tests/a11y/coverage.mjs`, `tests/a11y/pages.mjs`, `tests/screenreader/coverage.mjs` and the docs page list.
 * @property {Record<string, string[]>} [pageFolders] A catalog page id to the folders and style partials of the plugins
 * and editors its fixture turns on.
 * @property {Record<string, string[]>} [scenarioFolders] A screen reader scenario to the same.
 * @property {Record<string, string[]>} [docsFolders] A docs page id to the folder of its guide.
 * @property {Record<string, string[]>} [pageMeasurement] A catalog page id to the files that decide what is measured on it.
 * @property {Record<string, string[]>} [scenarioMeasurement] A scenario to its scenario file and goldens.
 * @property {Record<string, string[]>} [checkMeasurement] A check to its spec.
 */

/**
 * Where each page's code lives, from the repository's own tables.
 *
 * @param {object} tables The tables.
 * @param {Record<string, {pages?: string[]}>} [tables.plugins] `PLUGIN_COVERAGE` of `tests/a11y/coverage.mjs`.
 * @param {Record<string, {pages?: string[]}>} [tables.editors] `EDITOR_COVERAGE` of the same file.
 * @param {Array<{id: string, fixture?: string}>} [tables.pages] `A11Y_PAGES` of `tests/a11y/pages.mjs`.
 * @param {Record<string, {scenarios?: string[]}>} [tables.readerFeatures] `SR_FEATURE_COVERAGE` of
 * `tests/screenreader/coverage.mjs`, keyed by the same plugin and editor names.
 * @param {string[]} [tables.readerProjects] `SCREENREADER_PROJECTS` of `tests/lib/screenreader-matrix.mjs`.
 * @param {Record<string, {spec?: string}>} [tables.checks] `EVIDENCE_CHECKS` and `SITE_CHECKS` of `tests/lib`, by id.
 * @param {Array<{id: string, folder: string}>} [tables.docsGuides] A docs page id and the folder its guide lives in
 * (`docsGuideFolders()`).
 * @returns {SurfaceMaps} The maps `surfaceOf()` reads.
 */
export function surfaceMaps({ plugins = {}, editors = {}, pages = [], readerFeatures = {}, readerProjects = [], checks = {}, docsGuides = [] }) {
  const maps = { pageFolders: {}, scenarioFolders: {}, docsFolders: {}, pageMeasurement: {}, scenarioMeasurement: {}, checkMeasurement: {} };
  const add = (map, key, value) => {
    map[key] = [...new Set([...(Object.hasOwn(map, key) ? map[key] : []), value])].sort();
  };
  // A feature's own code: its folder, and its style partial, which is named after it in kebab case.
  const pathsOf = (name) => {
    let kind = null;

    if (Object.hasOwn(plugins, name)) {
      kind = 'plugins';
    } else if (Object.hasOwn(editors, name)) {
      kind = 'editors';
    }

    return kind === null ? [] : [`handsontable/src/${kind}/${name}/`,
      `handsontable/src/styles/components/${kind}/_${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}.scss`];
  };

  for (const table of [plugins, editors]) {
    for (const [name, entry] of Object.entries(table)) {
      for (const page of entry.pages ?? []) {
        pathsOf(name).forEach(owned => add(maps.pageFolders, page, owned));
      }
    }
  }
  for (const [name, entry] of Object.entries(readerFeatures)) {
    for (const scenario of entry.scenarios ?? []) {
      pathsOf(name).forEach(owned => add(maps.scenarioFolders, scenario, owned));
    }
  }
  for (const page of pages) {
    if (typeof page.fixture === 'string') {
      add(maps.pageMeasurement, page.id, `tests/fixtures/demo/${page.fixture}`);
    }
  }
  for (const scenario of new Set(Object.values(readerFeatures).flatMap(entry => entry.scenarios ?? []))) {
    add(maps.scenarioMeasurement, scenario, `tests/screenreader/scenarios/${scenario}.scenario.json`);

    for (const project of readerProjects) {
      add(maps.scenarioMeasurement, scenario, `tests/screenreader/goldens/${project}/${scenario}.json`);
    }
  }
  for (const [id, entry] of Object.entries(checks)) {
    if (entry.site) {
      add(maps.checkMeasurement, id, `tests/a11y/sites/${entry.spec}`);
    } else {
      add(maps.checkMeasurement, id, `tests/a11y/checks/${entry.spec ?? `${id}.spec.ts`}`);
    }
  }

  add(maps.checkMeasurement, 'axe', 'tests/a11y/axe.spec.ts');
  add(maps.checkMeasurement, 'axe', 'tests/a11y/axe-scan.ts');
  add(maps.checkMeasurement, 'docs-axe', 'tests/a11y/docs/');

  for (const { id, folder } of docsGuides) {
    add(maps.docsFolders, id, folder);
  }

  return maps;
}

/**
 * The folder each docs guide page lives in. The docs visual list names a guide by a path, and for most guides that is
 * where the file is. For the rest the list's last segment is the slug the page is served at, and the file sits in a
 * folder of another name (`basic-clipboard` is served by `cell-features/clipboard/clipboard.md`): the guide that
 * declares that slug as its `permalink` is the one, as it is for the scan that opens the page.
 *
 * @param {Array<{id: string, listPath: string, slug: string}>} guides A docs page id, its guide's path in the visual
 * list (`guides/<section>/<folder>/<file>`) and the slug the page is served at.
 * @param {object} content What the docs content holds.
 * @param {Iterable<string>} content.files The guide files, as paths from the repository root.
 * @param {Record<string, string>} content.permalinks A slug to the guide file whose `permalink` it is.
 * @returns {{guides: Array<{id: string, folder: string}>, missing: string[]}} The pages with their folder, and the
 * ids of the pages no guide was found for.
 */
export function docsGuideFolders(guides, { files, permalinks }) {
  const known = new Set(files);
  const folderOf = file => `${file.split('/').slice(0, -1).join('/')}/`;
  const resolved = [];
  const missing = [];

  for (const { id, listPath, slug } of guides) {
    const listed = ['.md', '.mdx'].map(extension => `docs/content/${listPath}${extension}`).find(file => known.has(file));
    const file = listed ?? (Object.hasOwn(permalinks, slug) ? permalinks[slug] : null);

    if (file) {
      resolved.push({ id, folder: folderOf(file) });
    } else {
      missing.push(id);
    }
  }

  return { guides: resolved, missing };
}

/**
 * A pull request title as the packet may carry it: the subject without its `(#n)` suffix and without task ids.
 *
 * @param {string} text The text.
 * @returns {string} The text, with every task id gone.
 */
export function scrubTaskIds(text) {
  // A subject opens with its task (`DEV-458: Fix …`): the id goes with its separator. One elsewhere leaves a mark.
  return String(text).replace(/^\s*([A-Z][A-Z0-9]*-\d+)\s*[:-]?\s*/, (lead, id) => (isTaskId(id) ? '' : lead))
    .replace(TASK_ID, id => (isTaskId(id) ? '(task)' : id)).replace(/\s+/g, ' ').trim();
}

/**
 * The task ids a text names.
 *
 * @param {string} text The text.
 * @returns {string[]} The ids, each once, in order of appearance.
 */
export function taskIdsIn(text) {
  return [...new Set((String(text).match(TASK_ID) ?? []).filter(isTaskId))];
}

/**
 * The pull request a squashed commit's subject names.
 *
 * @param {string} subject The subject (`Use the design's colors in the formula builder (#14270)`).
 * @returns {number|null} The number, or `null` for a commit pushed without one.
 */
export function pullRequestOf(subject) {
  const match = PULL_REQUEST.exec(String(subject));

  return match ? Number(match[1]) : null;
}

/**
 * The commits of `git log --first-parent --diff-merges=first-parent --name-only --format=%x1e%H%x1f%s`.
 *
 * @param {string} text The output: one record per commit, opened by a record separator, the hash and the subject
 * split by a unit separator, then the changed paths one per line.
 * @returns {Commit[]} The commits, newest first as git lists them.
 */
export function parseGitLog(text) {
  return String(text).split('\x1e').slice(1).map((record) => {
    const [head, ...lines] = record.split('\n');
    const [sha, subject = ''] = head.split('\x1f');

    return {
      sha: sha.trim(),
      pullRequest: pullRequestOf(subject),
      title: scrubTaskIds(subject.replace(PULL_REQUEST, '')),
      files: lines.map(line => line.trim()).filter(Boolean),
    };
  }).filter(commit => commit.sha !== '');
}

/**
 * The changes of `git diff --raw --no-renames -z`.
 *
 * @param {string} text The output: `:<old mode> <new mode> <old sha> <new sha> <status>`, a NUL, the path, a NUL.
 * @returns {Array<{path: string, status: string, mode: string}>} The changes; `mode` is the new file mode.
 */
export function parseRawDiff(text) {
  const parts = String(text).split('\0');
  const changes = [];

  for (let index = 0; index + 1 < parts.length; index += 2) {
    // The fields, in git's order: the old mode, the new mode, the old object, the new object, the status.
    const [, newMode = '', , , status = ''] = parts[index].replace(/^:/, '').split(' ');

    changes.push({ path: parts[index + 1], status: status.charAt(0), mode: newMode });
  }

  return changes;
}

/**
 * Nights newest first.
 *
 * @param {object[]} nights The nights.
 * @returns {object[]} The nights, sorted.
 */
function newestFirst(nights) {
  return [...nights].sort((a, b) => Date.parse(b.seenAt) - Date.parse(a.seenAt) || String(b.runId).localeCompare(String(a.runId), 'en', { numeric: true }));
}

/**
 * The workflow that records a night source.
 *
 * @param {string} source The night source.
 * @returns {string} The workflow's name.
 */
function workflowOf(source) {
  return Object.keys(SOURCES_OF_WORKFLOW).find(workflow => SOURCES_OF_WORKFLOW[workflow].includes(source)) ?? source;
}

/**
 * A night as the packet names it.
 *
 * @param {object|null} night The night's record.
 * @returns {{runId: string, seenAt: string, headSha: string|null, problems: number}|null} The night.
 */
function nightOf(night) {
  return night ? { runId: String(night.runId), seenAt: night.seenAt, headSha: night.headSha ?? null, problems: Number(night.problems ?? 0) } : null;
}

/**
 * The two audits the routine compares, per source: the latest night and the one before it.
 *
 * @param {object|null} ledgerDoc The published ledger, any version.
 * @returns {Array<{source: string, workflow: string, latest: object|null, previous: object|null}>} One entry per
 * night source, with the nights' own records (`null` where the ledger holds none).
 */
export function auditPairs(ledgerDoc) {
  const ledger = migrateA11yLedger(ledgerDoc ?? null);

  return NIGHT_SOURCES.map((source) => {
    const [latest = null, previous = null] = newestFirst((ledger?.nights ?? []).filter(night => night.source === source));

    return { source, workflow: workflowOf(source), latest, previous };
  });
}

/**
 * Why the routine must not run on this ledger now: every audit source needs a night inside the window with no
 * problem recorded, on develop, with the commit it audited.
 *
 * @param {ReturnType<typeof auditPairs>} pairs The audits.
 * @param {object} options Options.
 * @param {Date|string|number} options.now The time of the run.
 * @param {number} [options.maxAgeHours] The window (`LEARN_MAX_AGE_HOURS`).
 * @returns {string[]} The reasons; empty when the routine may run.
 */
export function refusalsOf(pairs, { now, maxAgeHours = LEARN_MAX_AGE_HOURS }) {
  const at = new Date(now).getTime();
  const reasons = [];

  for (const { source, workflow, latest } of pairs) {
    if (latest === null) {
      reasons.push(`${workflow} (${source}) has no audit in the ledger`);
    } else {
      const age = (at - Date.parse(latest.seenAt)) / HOUR_MS;

      if (!(age >= 0 && age <= maxAgeHours)) {
        reasons.push(`${workflow} (${source}) was last audited ${latest.seenAt}, ${age < 0 ? 'after the time of this run' : `${Math.floor(age)} hours ago`}: `
          + `the routine needs an audit of every source in the last ${maxAgeHours} hours`);
      }
      if (Number(latest.problems ?? 0) !== 0) {
        reasons.push(`${workflow} (${source}) run ${latest.runId} recorded ${latest.problems} tooling ${Number(latest.problems) === 1 ? 'problem' : 'problems'}: `
          + 'a target that was not measured resolves nothing and makes its findings new next time');
      }
      if (latest.branch !== undefined && latest.branch !== 'develop') {
        reasons.push(`${workflow} (${source}) run ${latest.runId} audited ${latest.branch}, not develop`);
      }
      if (typeof latest.headSha !== 'string' || latest.headSha === '') {
        reasons.push(`${workflow} (${source}) run ${latest.runId} names no audited commit`);
      }
    }
  }

  return reasons;
}

/**
 * The source behind a row's page, as path prefixes.
 *
 * @param {object} row The row.
 * @param {SurfaceMaps} maps What the repository says about the pages.
 * @returns {{page: string[], shared: string[], owned: RegExp, notProduct: RegExp, measurement: string[]}|null} The
 * surface: the folders that belong to the page, the prefixes every page shares, and the files that decide what is
 * measured there. `null` for a source whose code is not in this repository.
 */
export function surfaceOf(row, maps = {}) {
  const source = nightSourceOf(row);
  const table = SURFACES[source];

  if (!table) {
    return null;
  }

  const own = (map, key) => (map && Object.hasOwn(map, key) ? map[key] : []);
  let page = [];
  let measurement = [];

  if (source === 'a11y') {
    page = own(maps.pageFolders, row.page);
    measurement = [...own(maps.pageMeasurement, row.page), ...own(maps.checkMeasurement, row.check)];
  } else if (source === 'reader') {
    page = own(maps.scenarioFolders, row.page);
    measurement = own(maps.scenarioMeasurement, row.page);
  } else {
    page = own(maps.docsFolders, row.page);
    measurement = own(maps.checkMeasurement, row.check);
  }

  return { page: [...page], shared: [...table.shared], owned: table.owned, notProduct: table.notProduct, measurement: [...measurement] };
}

/**
 * The commits of a range that touched a surface, strongest tie first.
 *
 * @param {ReturnType<typeof surfaceOf>} surface The surface.
 * @param {Commit[]} commits The range.
 * @returns {{page: Array<{commit: Commit, files: string[]}>, shared: Array<{commit: Commit, files: string[]}>,
 * measurement: Array<{commit: Commit, files: string[]}>}} The commits that changed the page's own folders, the ones
 * that changed shared code only, and the ones that changed what is measured.
 */
export function candidatesOf(surface, commits) {
  const result = { page: [], shared: [], measurement: [] };

  if (surface === null) {
    return result;
  }

  const under = (path, prefixes) => prefixes.some(prefix => path === prefix || path.startsWith(prefix));

  for (const commit of commits) {
    const product = commit.files.filter(path => !surface.notProduct.test(path));
    const own = product.filter(path => under(path, surface.page));
    const shared = product.filter(path => under(path, surface.shared) && !surface.owned.test(path) && !under(path, surface.page));
    const measured = commit.files.filter(path => under(path, surface.measurement));

    if (own.length > 0) {
      result.page.push({ commit, files: own });
    } else if (shared.length > 0) {
      result.shared.push({ commit, files: shared });
    }
    if (measured.length > 0) {
      result.measurement.push({ commit, files: measured });
    }
  }

  return result;
}

/**
 * What says two rows are the same defect on two pages: the rule (or the kind, for a check with no rule), the cause
 * and the element, within one night source. A screen reader row names a step, not an element, so its defect is its
 * cluster, and a row no cluster matches has none.
 *
 * @param {object} row The row, with its `cluster`.
 * @returns {string|null} The identity, or `null`.
 */
export function defectIdentity(row) {
  if (row.source === READER_SOURCE) {
    return row.cluster === TRIAGE_ID ? null : `reader|${row.cluster}`;
  }

  return [nightSourceOf(row), row.rule ?? row.kind, row.cause ?? '', row.where].join('|');
}

/**
 * What a re-keyed row shares with the row it replaced: everything in the key but the selector or step.
 *
 * @param {object} row The row.
 * @returns {string} The target key.
 */
function targetIdentity(row) {
  return [row.source, row.check, row.kind, row.rule ?? '', row.cause ?? '', row.page, row.theme ?? '', row.state ?? '', row.variant ?? ''].join('|');
}

/**
 * The pages a night named a target on, whatever the check: what tells a page the previous audit knew from one added
 * since. The axe scans keep no per-page coverage (a scan is complete or not), and every scanned page is a target of
 * some check beyond axe, so the checks' and the readers' targets stand for the page list.
 *
 * @param {object|null} night The night's record, with its coverage.
 * @returns {Set<string>} The page ids, and the scenarios for a screen reader night.
 */
function pagesMeasured(night) {
  const pages = new Set();

  for (const targets of Object.values(night?.coverage?.checks ?? {})) {
    for (const target of targets) {
      pages.add(String(target).split('|')[0]);
    }
  }
  for (const pair of [...(night?.coverage?.reader ?? []), ...(night?.coverage?.golden ?? [])]) {
    pages.add(String(pair).split('|')[1]);
  }

  return pages;
}

/**
 * Whether the previous screen reader night read a step, from the night's own record.
 *
 * @param {object} night The previous night.
 * @param {object} row The screen reader row.
 * @returns {boolean|null} The verdict; `null` when the night does not list the scenario's steps or the row names none.
 */
function stepMeasured(night, row) {
  const projects = night?.reader;
  const scenario = projects && Object.hasOwn(projects, row.check) && Object.hasOwn(projects[row.check], row.page) ? projects[row.check][row.page] : null;

  return Array.isArray(scenario?.steps) && typeof row.where === 'string' ? scenario.steps.includes(row.where) : null;
}

/**
 * Why a new row is newly measured, or `null` when the previous audit had measured its target.
 *
 * @param {object} row The row.
 * @param {object|null} previous The previous night of the row's source, with its coverage.
 * @param {Set<string>} pagesThen The pages that night named (`pagesMeasured()`).
 * @returns {'first-audit'|'page'|'check'|'target'|'step'|null} The reason.
 */
function newlyMeasuredReason(row, previous, pagesThen) {
  if (previous === null) {
    return 'first-audit';
  }
  if (!pagesThen.has(row.page)) {
    return 'page';
  }
  if (nightMeasured(previous, row) === false) {
    if (row.source === READER_SOURCE || SCAN_SOURCES.has(row.source)) {
      return 'target';
    }

    return Object.hasOwn(previous.coverage?.checks ?? {}, row.check) ? 'target' : 'check';
  }
  if (row.source === READER_SOURCE && stepMeasured(previous, row) === false) {
    return 'step';
  }

  return null;
}

/**
 * The worst of a list of severities.
 *
 * @param {string[]} severities The severities.
 * @returns {string|null} The worst, or `null` for none.
 */
function worstSeverity(severities) {
  return SEVERITY_ORDER.find(severity => severities.includes(severity)) ?? null;
}

/**
 * The values of a field over rows, each once, sorted.
 *
 * @param {object[]} rows The rows.
 * @param {(row: object) => unknown} pick The field.
 * @returns {string[]} The values.
 */
function distinct(rows, pick) {
  return [...new Set(rows.map(pick).flat().filter(value => value !== null && value !== undefined && value !== ''))].map(String).sort();
}

/**
 * A commit as a group lists it.
 *
 * @param {{commit: Commit, files: string[]}} hit The commit and the paths that tie it to the surface.
 * @param {'page'|'shared'} tier How strong the tie is.
 * @returns {object} The candidate.
 */
function candidateOf({ commit, files }, tier) {
  return { pullRequest: commit.pullRequest, sha: commit.sha.slice(0, 10), title: commit.title, tier, fileCount: files.length,
    files: files.slice(0, LEARN_LISTED.files) };
}

/**
 * How many strikes a class has, and whether that makes its rule a check: two distinct pull requests, or two audits.
 *
 * @param {Array<{audit: string, pullRequest: number}>} strikes The strikes of `rules.json`.
 * @returns {{count: number, pullRequests: number, audits: number, becomesCheck: boolean}} The count.
 */
export function strikeCount(strikes = []) {
  const pullRequests = new Set(strikes.map(strike => strike.pullRequest)).size;
  const audits = new Set(strikes.map(strike => strike.audit)).size;

  return { count: strikes.length, pullRequests, audits, becomesCheck: pullRequests >= 2 || audits >= 2 };
}

/**
 * The classes of `rules.json` as the packet carries them, by id.
 *
 * @param {object|null} rules The parsed `rules.json`, or `null` when the skill has none yet.
 * @returns {Record<string, object>} Each class with its rule, its checks and its strikes.
 */
function classesOf(rules) {
  return Object.fromEntries((rules?.classes ?? []).map(entry => [entry.id, {
    id: entry.id, name: entry.name, home: entry.home, rule: entry.rule ?? null, enforcedBy: entry.enforcedBy ?? [],
    strikes: entry.strikes ?? [], ...strikeCount(entry.strikes ?? []),
  }]));
}

/**
 * Sorts the new rows of the latest audit of each source, and builds the packet.
 *
 * @param {object} input The inputs.
 * @param {object} input.ledger The published ledger, any version.
 * @param {Record<string, object|null>} [input.coverage] Per night source, the previous night's record as the ledger
 * published at that time kept it, with its `coverage`. Absent for a source: its new rows cannot be sorted.
 * @param {Record<string, Commit[]|null>} [input.commits] Per night source, the first-parent commits between the two
 * audited commits. `null` when the range cannot be read.
 * @param {object} input.catalog The compiled cluster catalog, as it is today.
 * @param {object|null} [input.rules] The parsed `rules.json` of the accessibility skill, or `null`.
 * @param {SurfaceMaps} [input.maps] Where each page's code lives.
 * @param {Date|string|number} input.now The time of the run.
 * @param {number} [input.maxAgeHours] The audit window (`LEARN_MAX_AGE_HOURS`).
 * @param {boolean} [input.dryRun] Whether the run only reports: a refused dry run still sorts.
 * @param {Record<string, string>} [input.rangeErrors] Per night source, why its range cannot be read, in the caller's words.
 * @returns {object} The packet.
 */
export function learnPacket({ ledger: ledgerDoc, coverage = {}, commits = {}, catalog, rules = null, maps = {}, now, maxAgeHours = LEARN_MAX_AGE_HOURS,
  dryRun = false, rangeErrors = {} }) {
  const ledger = migrateA11yLedger(ledgerDoc ?? null);
  const pairs = auditPairs(ledger);
  const clusters = new Map(catalog.clusters.map(cluster => [cluster.id, cluster]));
  const classes = classesOf(rules);
  const notPreventable = new Map((rules?.notPreventable ?? []).map(entry => [entry.cluster, entry.reason]));
  // Every row under today's catalog, like the digest: a row keeps its key, and its cluster is the one the catalog names now.
  const rows = (ledger?.rows ?? []).map(row => ({ ...row, cluster: clusterOf(row, catalog).id }));
  const refusals = refusalsOf(pairs, { now, maxAgeHours });

  if (rules === null) {
    refusals.push(`${LEARN_RULES_FILE} is missing: the defect classes and their rules are what a finding is sorted against`);
  }

  const sorted = [];
  const audits = [];

  for (const { source, workflow, latest, previous } of pairs) {
    const range = commits[source] ?? null;
    const previousWithCoverage = previous !== null && coverage[source]?.coverage && String(coverage[source].runId) === String(previous.runId)
      ? { ...previous, coverage: coverage[source].coverage } : null;
    const audit = { source, workflow, latest: nightOf(latest), previous: nightOf(previous), newFindings: 0, returnedFindings: 0,
      coverage: 'none', range: null };

    audits.push(audit);

    if (latest === null) {
      continue;
    }

    const ofSource = rows.filter(row => nightSourceOf(row) === source);
    const fresh = ofSource.filter(row => String(row.firstRun) === String(latest.runId));
    // A finding that was resolved and is seen again keeps the night it was first seen on: the ledger marks its return
    // with `backAt`, and a row written before that field existed says so with its gap count, as the ledger's own
    // history reads it. A pull request that brings a fixed defect back is what the routine is for.
    const cameBack = row => String(row.firstRun) !== String(latest.runId) && String(row.lastRun) === String(latest.runId)
      && (typeof row.backAt === 'string' ? row.backAt === latest.seenAt : (Number(row.gaps) > 0 && row.seenSinceGap === 1));
    const back = new Set(ofSource.filter(cameBack).map(row => row.key));
    const toSort = [...fresh, ...ofSource.filter(row => back.has(row.key))];

    audit.newFindings = fresh.length;
    audit.returnedFindings = back.size;

    if (previous !== null) {
      audit.coverage = previousWithCoverage ? 'known' : 'unknown';
      audit.range = { from: previous.headSha ?? null, to: latest.headSha ?? null, commits: range?.length ?? null,
        pullRequests: range ? new Set(range.map(commit => commit.pullRequest).filter(Boolean)).size : null };

      if (!previousWithCoverage && toSort.length > 0) {
        refusals.push(`${workflow} (${source}): what run ${previous.runId} measured is not known, so a new finding cannot be told from a newly measured one `
          + '(the ledger state published before the latest audit is not readable)');
      }
      if (range === null && toSort.length > 0 && Object.hasOwn(SURFACES, source)) {
        refusals.push(`${workflow} (${source}): the commits between ${previous.headSha} and ${latest.headSha} cannot be read`
          + `${Object.hasOwn(rangeErrors, source) ? ` (${rangeErrors[source]})` : ''}`);
      }
    }

    const latestAt = Date.parse(latest.seenAt);
    // A row that came back in this audit was resolved before it, so it was not open then.
    const openBefore = row => String(row.firstRun) !== String(latest.runId) && Date.parse(row.firstSeen) < latestAt && !back.has(row.key)
      && (row.resolvedAt === null || row.resolvedAt === undefined || Date.parse(row.resolvedAt) >= latestAt);
    // The pages each defect was open on before this audit, to tell an old defect on a new page.
    const pagesOfDefect = new Map();

    for (const row of ofSource.filter(openBefore)) {
      const identity = defectIdentity(row);

      if (identity !== null) {
        pagesOfDefect.set(identity, (pagesOfDefect.get(identity) ?? new Set()).add(row.page));
      }
    }

    const elsewhere = (row) => {
      const identity = defectIdentity(row);
      const pages = identity === null ? null : pagesOfDefect.get(identity);

      return pages ? [...pages].filter(page => page !== row.page).length : 0;
    };
    // The rows resolved this night, by target: a new row on a target that lost one the same night is a re-key.
    const resolvedTonight = new Map();

    for (const row of ofSource) {
      if (row.status === 'resolved' && row.resolvedAt === latest.seenAt) {
        resolvedTonight.set(targetIdentity(row), (resolvedTonight.get(targetIdentity(row)) ?? 0) + 1);
      }
    }

    const pagesThen = pagesMeasured(previousWithCoverage);

    for (const row of toSort.sort((a, b) => a.key.localeCompare(b.key))) {
      const cluster = clusters.get(row.cluster) ?? null;
      const entry = { row, source, returned: back.has(row.key), outcome: 'unsorted', reason: null, elsewhere: elsewhere(row), surface: null, hits: null };

      sorted.push(entry);

      if (previous !== null && previousWithCoverage === null) {
        entry.reason = 'coverage-unknown';
        continue;
      }

      const reason = newlyMeasuredReason(row, previousWithCoverage, pagesThen);

      if (reason !== null) {
        entry.outcome = entry.elsewhere > 0 ? 'inherited' : 'newly-measured';
        entry.reason = reason;
      } else if ((resolvedTonight.get(targetIdentity(row)) ?? 0) > 0) {
        resolvedTonight.set(targetIdentity(row), resolvedTonight.get(targetIdentity(row)) - 1);
        entry.outcome = 'newly-measured';
        entry.reason = 'selector';
      } else if (row.cluster === TRIAGE_ID) {
        entry.outcome = 'needs-triage';
      } else if (cluster?.notDefect) {
        entry.outcome = 'not-a-defect';
        entry.reason = cluster.notDefect;
      }

      // The candidates are read for a dropped row too: the packet says when a first reading sits on code the range changed.
      entry.surface = surfaceOf(row, maps);
      entry.hits = range === null ? null : candidatesOf(entry.surface, range);

      if (entry.outcome !== 'unsorted') {
        continue;
      }
      if (entry.surface === null) {
        entry.outcome = 'not-on-changed-code';
        entry.reason = 'other-repository';
      } else if (entry.hits === null) {
        entry.reason = 'range-unknown';
      } else if (entry.hits.page.length === 0 && entry.hits.shared.length === 0) {
        entry.outcome = 'not-on-changed-code';
        entry.reason = 'surface-unchanged';
      } else {
        entry.outcome = 'attributable';
        entry.reason = entry.hits.page.length > 0 ? 'page' : 'shared';
      }
    }
  }

  const countBy = (entries, pick) => {
    const counts = {};

    for (const entry of entries) {
      const key = pick(entry);

      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  };
  const groupsOf = (entries) => {
    const groups = new Map();

    for (const entry of entries) {
      const id = `${entry.row.cluster}@${entry.source}:${entry.row.page}`;

      groups.set(id, [...(groups.get(id) ?? []), entry]);
    }

    return [...groups].sort((a, b) => a[0].localeCompare(b[0]));
  };
  const attributable = groupsOf(sorted.filter(entry => entry.outcome === 'attributable')).map(([id, entries]) => {
    const [first] = entries;
    const cluster = clusters.get(first.row.cluster) ?? null;
    const classId = cluster?.defectClass ?? null;
    const groupRows = entries.map(entry => entry.row);
    // A group's rows share their page, so the code behind them is one. What measures them is not: a group can hold
    // rows of several checks, each with a spec of its own, so the changes to what is measured are every row's.
    const { page, shared } = first.hits;
    const measured = new Map();

    for (const { hits } of entries) {
      for (const hit of hits.measurement) {
        const files = measured.get(hit.commit.sha)?.files ?? [];

        measured.set(hit.commit.sha, { commit: hit.commit, files: [...new Set([...files, ...hit.files])].sort() });
      }
    }

    const measurement = [...measured.values()];
    const returned = entries.filter(entry => entry.returned);
    const tier = page.length > 0 ? 'page' : 'shared';
    const listed = (tier === 'page' ? page : shared).map(hit => candidateOf(hit, tier));
    const elements = distinct(groupRows, row => row.where);
    const reasons = distinct(groupRows, row => row.reason);

    return {
      id,
      source: first.source,
      page: first.row.page,
      cluster: first.row.cluster,
      title: cluster?.title ?? first.row.cluster,
      tracked: Boolean(cluster?.tracker),
      defectClass: classId,
      class: classId !== null && Object.hasOwn(classes, classId) ? classes[classId] : null,
      knownNotPreventable: notPreventable.get(first.row.cluster) ?? null,
      findings: groupRows.length,
      // How many of them were resolved before and came back in this audit, and how often the most restless of those
      // had come back already: a regression comes back once, a reading that flaps keeps doing it.
      returned: returned.length,
      returnedBefore: Math.max(0, ...returned.map(entry => Number(entry.row.gaps ?? 1) - 1)),
      severity: worstSeverity(groupRows.map(row => row.severity)),
      criteria: distinct(groupRows, row => row.criteria ?? []),
      checks: distinct(groupRows, row => row.check),
      rules: distinct(groupRows, row => row.rule ?? row.kind),
      themes: distinct(groupRows, row => row.theme),
      elements: elements.slice(0, LEARN_LISTED.elements),
      moreElements: Math.max(0, elements.length - LEARN_LISTED.elements),
      reasons: reasons.slice(0, LEARN_LISTED.reasons),
      // The same defect, already open on other pages before this audit: most often one old cause in one more place.
      openOnOtherPages: Math.max(...entries.map(entry => entry.elsewhere)),
      tier,
      surface: tier === 'page' ? first.surface.page : first.surface.shared,
      candidates: listed.slice(0, LEARN_LISTED.candidates),
      moreCandidates: Math.max(0, listed.length - LEARN_LISTED.candidates),
      // With the page's own folders changed, the shared code that also changed is named by number only.
      sharedPullRequests: tier === 'page' ? shared.map(hit => hit.commit.pullRequest ?? hit.commit.sha.slice(0, 10)) : [],
      // What decides the measurement changed in the range too: the finding may be the check's, not the code's.
      measurementChanges: measurement.map(hit => ({ pullRequest: hit.commit.pullRequest, sha: hit.commit.sha.slice(0, 10), files: hit.files.slice(0, LEARN_LISTED.files) })),
      keys: groupRows.map(row => row.key),
    };
  });
  const droppedGroups = outcome => groupsOf(sorted.filter(entry => entry.outcome === outcome)).map(([id, entries]) => {
    const [first] = entries;
    const hits = first.hits?.page ?? [];

    return {
      id,
      source: first.source,
      page: first.row.page,
      cluster: first.row.cluster,
      findings: entries.length,
      returned: entries.filter(entry => entry.returned).length,
      reasons: countBy(entries, entry => entry.reason ?? 'none'),
      // A first reading whose own source changed in the range: dropped all the same, and named so a reviewer sees it.
      sourceChangedBy: [...new Set(hits.map(hit => hit.commit.pullRequest ?? hit.commit.sha.slice(0, 10)))],
    };
  }).sort((a, b) => b.findings - a.findings || a.id.localeCompare(b.id));
  const outcomes = Object.fromEntries(LEARN_OUTCOMES.map(outcome => [outcome, sorted.filter(entry => entry.outcome === outcome).length]));
  const newlyMeasured = sorted.filter(entry => entry.outcome === 'newly-measured' || entry.outcome === 'inherited');
  // The grid's own code: the rate reads the grid's attributable findings against the pull requests that changed it. A
  // finding on the docs is tied to a pull request that changed a guide, which is on neither side of that rate.
  const gridCommits = new Map();
  const gridAttributable = sorted.filter(entry => entry.outcome === 'attributable' && GRID_SOURCES.includes(entry.source)).length;

  for (const source of GRID_SOURCES) {
    for (const commit of commits[source] ?? []) {
      if (commit.files.some(path => path.startsWith('handsontable/src/') || path.startsWith('wrappers/'))) {
        gridCommits.set(commit.sha, commit);
      }
    }
  }

  let result = 'nothing-attributable';

  if (refusals.length > 0) {
    result = 'refused';
  } else if (attributable.length > 0) {
    result = 'packet';
  }

  return {
    schema: LEARN_SCHEMA,
    generatedAt: new Date(now).toISOString(),
    dryRun,
    result,
    refusals,
    audits,
    counts: {
      new: sorted.filter(entry => !entry.returned).length,
      returned: sorted.filter(entry => entry.returned).length,
      outcomes,
      bySource: Object.fromEntries(NIGHT_SOURCES.map(source => [source, countBy(sorted.filter(entry => entry.source === source), entry => entry.outcome)])),
      newlyMeasuredBy: Object.fromEntries(NEWLY_MEASURED_REASONS.map(reason => [reason, newlyMeasured.filter(entry => entry.reason === reason).length])),
      attributableGroups: attributable.length,
    },
    metric: {
      attributableFindings: gridAttributable,
      sourcePullRequests: gridCommits.size,
      per10PullRequests: gridCommits.size > 0 ? Math.round((gridAttributable / gridCommits.size) * 100) / 10 : null,
    },
    rules: { file: LEARN_RULES_FILE, present: rules !== null, classes, notPreventable: [...notPreventable].map(([cluster, reason]) => ({ cluster, reason })) },
    attributable,
    dropped: {
      inherited: droppedGroups('inherited'),
      newlyMeasured: droppedGroups('newly-measured'),
      notOnChangedCode: droppedGroups('not-on-changed-code'),
      notADefect: droppedGroups('not-a-defect'),
      needsTriage: droppedGroups('needs-triage'),
      unsorted: droppedGroups('unsorted'),
    },
  };
}

/**
 * A count with its noun.
 *
 * @param {number} count The count.
 * @param {string} one The singular.
 * @param {string} many The plural.
 * @returns {string} The phrase.
 */
function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * A pull request as the packet's text names it: by number, never by a task.
 *
 * @param {number|string|null} pullRequest The number, or a short commit for one pushed without a pull request.
 * @returns {string} The reference.
 */
function reference(pullRequest) {
  return typeof pullRequest === 'number' ? `#${pullRequest}` : `commit ${escaped(pullRequest)}`;
}

/**
 * A value as the packet's page writes it, displayed as written: on one line, with every character Markdown or HTML
 * reads backslash-escaped by the reports' own `escapeMarkdownText()`, the backslash among them in the same pass.
 * The values come from the audits' findings, the catalog and commit subjects, and the page is rendered by GitHub
 * when its lines reach a pull request, so none of them may turn into markup or end a table cell there. Escaping the
 * pipe alone would let a backslash in the value pair with the added one.
 *
 * @param {unknown} value The value.
 * @returns {string} The text.
 */
function escaped(value) {
  return escapeMarkdownText(String(value ?? '').replace(/\s+/g, ' ').trim());
}

/**
 * A value in code font: a selector, a path, a page id, a commit range. A `<code>` element, never a backtick span,
 * which cannot escape a backslash or a backtick of the value.
 *
 * @param {unknown} value The value.
 * @returns {string} The element.
 */
function code(value) {
  return `<code>${escaped(value)}</code>`;
}

/**
 * The lines of one dropped list: the largest groups, and the rest summed.
 *
 * @param {object[]} groups The groups, largest first.
 * @returns {string[]} The lines.
 */
function droppedLines(groups) {
  const shown = groups.slice(0, LEARN_LISTED.dropped);
  const rest = groups.slice(LEARN_LISTED.dropped);
  const lines = shown.map((group) => {
    const reasons = Object.entries(group.reasons).filter(([reason]) => reason !== 'none').map(([reason, count]) => `${escaped(reason)} ${count}`).join(', ');
    const changed = group.sourceChangedBy.length > 0 ? `; its source changed in the range: ${group.sourceChangedBy.map(reference).join(', ')}` : '';
    const back = group.returned > 0 ? `; ${group.returned} came back` : '';

    return `- ${group.findings} · ${code(group.page)} (${group.source}) · ${escaped(group.cluster)}${reasons ? ` · ${reasons}` : ''}${back}${changed}`;
  });

  if (rest.length > 0) {
    lines.push(`- ${rest.reduce((sum, group) => sum + group.findings, 0)} more in ${plural(rest.length, 'group', 'groups')}`);
  }

  return lines;
}

/**
 * The packet as a page a person or an agent reads first.
 *
 * @param {object} packet The packet of `learnPacket()`.
 * @returns {string} The Markdown.
 */
export function renderPacket(packet) {
  const { counts, dropped } = packet;
  const lines = ['# Accessibility learning packet', ''];
  const results = {
    refused: 'Refused. Nothing here may become a pull request.',
    'nothing-attributable': 'Nothing attributable: no new finding sits on code changed since the previous audit.',
    packet: `${plural(counts.outcomes.attributable, 'finding', 'findings')} to sort, in ${plural(counts.attributableGroups, 'group', 'groups')}.`,
  };

  lines.push(`Result: **${packet.result}**. ${results[packet.result]}`);

  if (packet.dryRun) {
    lines.push('', 'A dry run: it reports, and no pull request follows from it.');
  }
  if (packet.refusals.length > 0) {
    lines.push('', '## Why it is refused', '', ...packet.refusals.map(reason => `- ${escaped(reason)}`));
  }

  lines.push('', '## The audits compared', '', '| Source | Latest audit | Previous audit | Range | Pull requests | New findings | Came back |',
    '|---|---|---|---|---|---|---|');

  for (const audit of packet.audits) {
    const night = value => (value ? `${escaped(String(value.seenAt).slice(0, 10))}, run ${escaped(value.runId)}` : 'none');
    const range = audit.range?.from && audit.range?.to ? code(`${audit.range.from.slice(0, 10)}..${audit.range.to.slice(0, 10)}`) : 'none';

    lines.push(`| ${audit.source} | ${night(audit.latest)} | ${night(audit.previous)} | ${range} | ${audit.range?.pullRequests ?? 'not read'} | ${audit.newFindings} `
      + `| ${audit.returnedFindings} |`);
  }

  const by = counts.newlyMeasuredBy;
  const measured = NEWLY_MEASURED_REASONS.filter(reason => by[reason] > 0).map(reason => `${reason} ${by[reason]}`).join(', ');

  lines.push('', '## Where the new findings went', '',
    `- New findings: ${counts.new}`,
    `- Findings that came back after they were resolved: ${counts.returned}`,
    `- Dropped, inherited (an old defect read in a new place): ${counts.outcomes.inherited}`,
    `- Dropped, newly measured: ${counts.outcomes['newly-measured']}`,
    `- Both drops by what was new: ${measured || 'none'}`,
    `- Set aside, the catalog says it is not a defect: ${counts.outcomes['not-a-defect']}`,
    `- Set aside, needs triage in the catalog first: ${counts.outcomes['needs-triage']}`,
    `- Set aside, not on changed code: ${counts.outcomes['not-on-changed-code']}`,
    `- Not sorted (see the refusals): ${counts.outcomes.unsorted}`,
    `- **Attributable, to sort: ${counts.outcomes.attributable} in ${plural(counts.attributableGroups, 'group', 'groups')}**`,
    '',
    `Rate: ${packet.metric.attributableFindings} attributable ${packet.metric.attributableFindings === 1 ? 'finding' : 'findings'} on the grid against `
      + `${plural(packet.metric.sourcePullRequests, 'pull request', 'pull requests')} that changed \`handsontable/src\` or \`wrappers\``
      + `${packet.metric.per10PullRequests === null ? '' : ` (${packet.metric.per10PullRequests} per 10)`}.`);

  lines.push('', '## Attributable groups', '');

  if (packet.attributable.length === 0) {
    lines.push('None.');
  }
  for (const group of packet.attributable) {
    const rule = group.class;

    lines.push(`### ${escaped(group.cluster)} on ${code(group.page)} (${group.source})`, '',
      `- Cluster: ${escaped(group.title)}${group.tracked ? ' (tracked)' : ''}`,
      `- Findings: ${group.findings}, worst ${escaped(group.severity ?? 'unknown')}; criteria ${group.criteria.map(escaped).join(', ') || 'none named'}`,
      `- Checks: ${group.checks.map(escaped).join(', ')}; rules or kinds: ${group.rules.map(escaped).join(', ')}; themes: ${group.themes.map(escaped).join(', ') || 'none'}`,
      `- Elements: ${group.elements.map(code).join(', ')}${group.moreElements > 0 ? `, and ${group.moreElements} more` : ''}`,
      ...(group.reasons.length > 0 ? [`- Says: ${group.reasons.map(escaped).join(' / ')}`] : []));

    if (group.returned > 0) {
      lines.push(`- Came back after it was resolved: ${group.returned} of ${group.findings}, ${group.returnedBefore === 0 ? 'for the first time'
        : `and it had come back ${plural(group.returnedBefore, 'time', 'times')} before`}`);
    }

    if (rule) {
      const checks = rule.enforcedBy.map(item => `${escaped(item.check)} (${escaped(item.runs)})`).join(', ');

      lines.push(`- Class ${escaped(rule.id)}, ${escaped(rule.name)} (rule lives in: ${escaped(rule.home)})`,
        `- Rule: ${rule.rule === null ? 'none: record only' : escaped(rule.rule)}`,
        `- Enforced by: ${checks || 'nothing'}`,
        `- Strikes so far: ${rule.strikes.length} (${plural(rule.pullRequests, 'pull request', 'pull requests')}, ${plural(rule.audits, 'audit', 'audits')})`
          + `${rule.becomesCheck ? ': already at its second strike' : ''}`);
    } else {
      lines.push(`- Class: ${escaped(group.defectClass ?? 'none in the catalog')}${group.defectClass ? ', which rules.json does not list' : ''}`);
    }
    if (group.knownNotPreventable) {
      lines.push(`- Already recorded as not preventable: ${escaped(group.knownNotPreventable)}`);
    }
    if (group.openOnOtherPages > 0) {
      lines.push(`- The same finding was already open on ${plural(group.openOnOtherPages, 'other page', 'other pages')} before this audit`);
    }

    lines.push(`- Tie: ${group.tier === 'page' ? 'the page\'s own source changed' : 'only code every page shares changed'} `
      + `(${group.surface.map(code).join(', ')})`, '- Candidates:');

    for (const candidate of group.candidates) {
      const more = candidate.fileCount > candidate.files.length ? `, and ${candidate.fileCount - candidate.files.length} more` : '';

      lines.push(`  - ${reference(candidate.pullRequest ?? candidate.sha)} ${escaped(candidate.title)}: ${candidate.files.map(code).join(', ')}${more}`);
    }
    if (group.moreCandidates > 0) {
      lines.push(`  - and ${plural(group.moreCandidates, 'more pull request', 'more pull requests')} (the JSON lists every key, not every candidate)`);
    }
    if (group.sharedPullRequests.length > 0) {
      lines.push(`- Shared code also changed in: ${group.sharedPullRequests.map(reference).join(', ')}`);
    }
    if (group.measurementChanges.length > 0) {
      lines.push(`- What is measured changed too, so check the finding is the code's: ${group.measurementChanges
        .map(change => `${reference(change.pullRequest ?? change.sha)} (${change.files.map(code).join(', ')})`).join('; ')}`);
    }

    lines.push('');
  }

  const sections = [
    ['Dropped: inherited', dropped.inherited],
    ['Dropped: newly measured', dropped.newlyMeasured],
    ['Set aside: not on changed code', dropped.notOnChangedCode],
    ['Set aside: not a defect', dropped.notADefect],
    ['Set aside: needs triage', dropped.needsTriage],
    ['Not sorted', dropped.unsorted],
  ];

  for (const [title, groups] of sections) {
    if (groups.length > 0) {
      lines.push(`## ${title}`, '', ...droppedLines(groups), '');
    }
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

/**
 * A value as text that is the same for two objects with the same content, whatever the order of their keys.
 *
 * @param {unknown} value The value.
 * @returns {string} The text.
 */
function canonical(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value) ?? 'null';
}

/**
 * Why a change to the cluster catalog is not one the routine may make: only `defectClass` and `notDefect` of a
 * cluster that exists may differ.
 *
 * @param {object} before The catalog at the base.
 * @param {object} after The catalog in the change.
 * @returns {string[]} The problems.
 */
export function catalogProblems(before, after) {
  const problems = [];
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

  if (!isObject(before) || !isObject(after) || !Array.isArray(before.clusters) || !Array.isArray(after.clusters)) {
    return [`${LEARN_CATALOG_FILE} must stay a catalog with its "clusters" list`];
  }

  const { clusters: clustersBefore, ...headBefore } = before;
  const { clusters: clustersAfter, ...headAfter } = after;

  for (const key of new Set([...Object.keys(headBefore), ...Object.keys(headAfter)])) {
    if (canonical(headBefore[key]) !== canonical(headAfter[key])) {
      problems.push(`${LEARN_CATALOG_FILE}: "${key}" changed; the routine changes only ${LEARN_CATALOG_FIELDS.map(field => `"${field}"`).join(' and ')} of a cluster`);
    }
  }

  const idsBefore = clustersBefore.map(cluster => cluster?.id);
  const idsAfter = clustersAfter.map(cluster => cluster?.id);

  if (canonical(idsBefore) !== canonical(idsAfter)) {
    const added = idsAfter.filter(id => !idsBefore.includes(id));
    const removed = idsBefore.filter(id => !idsAfter.includes(id));
    let what = 'the clusters are in another order';

    if (added.length > 0 || removed.length > 0) {
      what = [added.length > 0 ? `added ${added.join(', ')}` : '', removed.length > 0 ? `removed ${removed.join(', ')}` : ''].filter(Boolean).join('; ');
    }

    return [...problems, `${LEARN_CATALOG_FILE}: the routine adds, removes and moves no cluster (${what})`];
  }

  clustersBefore.forEach((cluster, index) => {
    const strip = (entry) => {
      const copy = { ...entry };

      for (const field of LEARN_CATALOG_FIELDS) {
        delete copy[field];
      }

      return copy;
    };
    const was = strip(cluster);
    const is = strip(clustersAfter[index]);

    for (const key of new Set([...Object.keys(was), ...Object.keys(is)])) {
      if (canonical(was[key]) !== canonical(is[key])) {
        problems.push(`${LEARN_CATALOG_FILE}: cluster "${cluster.id}" changed "${key}"; the routine changes only `
          + `${LEARN_CATALOG_FIELDS.map(field => `"${field}"`).join(' and ')}`);
      }
    }
  });

  return problems;
}

/**
 * Why a change set is not one the routine's pull request may hold. It may touch the accessibility skill's folder,
 * and two fields of the catalog's clusters. Nothing else: no product code, no test, no baseline or golden, no
 * workflow, and not this routine's own skill or script. Inside the skill's folder `rules.json` is edited in place:
 * it stays, it stays JSON, and its budget stays as it was.
 *
 * @param {object} change The change set.
 * @param {Array<{path: string, status: string, mode?: string}>} change.changes Every path that differs from the base,
 * untracked files included (`parseRawDiff()`).
 * @param {object|null} [change.catalogBefore] The catalog at the base, when the change touches it.
 * @param {object|null} [change.catalogAfter] The catalog in the change, parsed; `null` when it is not JSON.
 * @param {object|null} [change.rulesBefore] `rules.json` at the base, parsed; `null` when it is missing or not JSON there.
 * @param {object|null} [change.rulesAfter] `rules.json` in the change, parsed; `null` when it is missing or not JSON.
 * @returns {string[]} The problems; empty when the change set is allowed.
 */
export function guardProblems({ changes, catalogBefore = null, catalogAfter = null, rulesBefore = null, rulesAfter = null }) {
  const problems = [];

  for (const { path, status, mode = REGULAR_FILE } of changes) {
    const inSkill = path.startsWith(LEARN_SKILL_DIR);

    if (!inSkill && path !== LEARN_CATALOG_FILE) {
      problems.push(`${path}: outside what the routine may change (${LEARN_SKILL_DIR} and ${LEARN_CATALOG_FIELDS.join(', ')} in ${LEARN_CATALOG_FILE})`);
    } else if (mode !== REGULAR_FILE && mode !== NO_FILE) {
      problems.push(`${path}: a plain file only, not a link, a submodule or an executable (mode ${mode})`);
    } else if (path === LEARN_CATALOG_FILE) {
      if (status !== 'M') {
        problems.push(`${path}: the routine edits the catalog in place; it never adds or deletes it`);
      } else if (catalogBefore === null || catalogAfter === null) {
        problems.push(`${path}: cannot be read as JSON on both sides, so its fields cannot be compared`);
      } else {
        problems.push(...catalogProblems(catalogBefore, catalogAfter));
      }
    } else if (path === LEARN_RULES_FILE) {
      // The rules hold the budget, every class and every strike: a file that is gone, new or not JSON has none of them
      // to compare, so it is a problem and never a pass.
      if (status !== 'M') {
        problems.push(`${path}: the routine edits the skill's rules in place; it never adds or deletes them`);
      } else if (rulesBefore === null || rulesAfter === null) {
        problems.push(`${path}: cannot be read as JSON on both sides, so its budget cannot be compared`);
      } else if (canonical(rulesBefore.budget) !== canonical(rulesAfter.budget)) {
        // The size budget of the skill is a person's to raise.
        problems.push(`${path}: "budget" changed; the routine never raises its own limits`);
      }
    }
  }

  return problems;
}

/**
 * The classes whose rule became a check in this change: a class that gained a strike and now has two distinct pull
 * requests or two audits among its strikes.
 *
 * @param {object|null} rulesBefore `rules.json` at the base.
 * @param {object|null} rulesAfter `rules.json` in the change.
 * @returns {string[]} The class ids.
 */
export function secondStrikes(rulesBefore, rulesAfter) {
  const before = new Map((rulesBefore?.classes ?? []).map(entry => [entry.id, entry.strikes ?? []]));

  return (rulesAfter?.classes ?? [])
    .filter(entry => (entry.strikes ?? []).length > (before.get(entry.id) ?? []).length && strikeCount(entry.strikes).becomesCheck)
    .map(entry => entry.id);
}

/**
 * Why the text of the routine's pull request is not acceptable: it names a task id other than the branch's own, or
 * it is silent on a rule that reached its second strike.
 *
 * @param {object} text The text.
 * @param {string} text.branch The branch (`feature/<TASK-ID>_Short-Description`).
 * @param {Array<{name: string, text: string}>} text.texts The commit messages and the pull request body.
 * @param {string|null} [text.body] The pull request body alone, when there is one yet.
 * @param {string[]} [text.promoted] The classes at their second strike (`secondStrikes()`).
 * @returns {string[]} The problems.
 */
export function textProblems({ branch, texts, body = null, promoted = [] }) {
  const allowed = taskIdsIn(branch);
  const problems = [];

  if (allowed.length > 1) {
    problems.push(`the branch ${branch} names ${allowed.length} task ids (${allowed.join(', ')}); a pull request carries at most one, everywhere`);
  }
  for (const { name, text } of texts) {
    const others = taskIdsIn(text).filter(id => !allowed.includes(id));

    if (others.length > 0) {
      problems.push(`${name} names ${others.join(', ')}: the ClickUp integration attaches every task id it finds in a pull request, for good; `
        + 'name another task in words or a pull request by its number');
    }
  }
  if (body !== null) {
    for (const id of promoted) {
      if (!new RegExp(`\\b${id}\\b`).test(body)) {
        problems.push(`the pull request body does not name ${id}, which reached its second strike in this change: say which check the rule needs`);
      }
    }
  }

  return problems;
}
