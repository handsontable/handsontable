#!/usr/bin/env node
/**
 * Proposes GitHub labels for a pull request from its changed paths and its changelog entry type.
 *
 * Usage:
 *   node scripts/claude/pr-labels.mjs [--base <ref>] [--changelog <path>] [--json]
 *
 * The diff base is the base branch of the current branch's PR (`gh pr view`), or `origin/develop`
 * when there is no PR yet. Pass `--base` to override it.
 *
 * The mapping is a hand-written table on purpose: plugin directory names do not match label
 * names, and fuzzy matching proposes wrong labels. A proposed label that does not exist in the
 * repository is dropped, and this script never creates labels.
 */
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs, promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const CELL_TYPE_AUTOCOMPLETE = 'Cell type: Autocomplete / Dropdown / Handsontable';
const CELL_TYPE_BASE = 'Cell type: Base / Text / Password';
const CELL_TYPE_CHECKBOX = 'Cell type: Checkbox';
const CELL_TYPE_DATE = 'Cell type: Date';
const CELL_TYPE_NUMERIC = 'Cell type: Numeric';
const CELL_TYPE_SELECT = 'Cell type: Select';
const CELL_TYPE_TIME = 'Cell type: Time';

/**
 * Directory name under `handsontable/src/plugins/` -> label.
 */
export const PLUGIN_LABELS = {
  autoColumnSize: 'Auto column size',
  autoRowSize: 'Auto row size',
  autofill: 'Auto fill',
  bindRowsWithHeaders: 'BindRowsWithHeaders',
  collapsibleColumns: 'Collapsing',
  columnSorting: 'Column sorting',
  columnSummary: 'Summary calculations',
  comments: 'Comments',
  contextMenu: 'Context menu',
  copyPaste: 'Copy-paste',
  customBorders: 'Custom borders',
  dropdownMenu: 'Dropdown menu',
  exportFile: 'Export',
  filters: 'Filtering',
  formulas: 'Formulas',
  freezeBar: 'Fixing / Freezing',
  hiddenColumns: 'Hiding',
  hiddenRows: 'Hiding',
  manualColumnFreeze: 'Fixing / Freezing',
  manualColumnMove: 'Moving',
  manualColumnResize: 'Resizing',
  manualRowMove: 'Moving',
  manualRowResize: 'Resizing',
  mergeCells: 'Merge cells',
  moveCells: 'Moving',
  multiColumnSorting: 'Multi-column sorting',
  nestedHeaders: 'Nested headers',
  nestedRows: 'Nested rows',
  search: 'Search',
  stretchColumns: 'Stretching',
  trimRows: 'Trimming',
  undoRedo: 'Undo-redo',
};

/**
 * Name of a folder in `editors`, `renderers`, `validators` or `cellTypes` (with its `Editor`,
 * `Renderer`, `Validator` or `Type` suffix removed) -> cell type label.
 */
export const CELL_TYPE_LABELS = {
  autocomplete: CELL_TYPE_AUTOCOMPLETE,
  dropdown: CELL_TYPE_AUTOCOMPLETE,
  handsontable: CELL_TYPE_AUTOCOMPLETE,
  base: CELL_TYPE_BASE,
  text: CELL_TYPE_BASE,
  password: CELL_TYPE_BASE,
  checkbox: CELL_TYPE_CHECKBOX,
  date: CELL_TYPE_DATE,
  intlDate: CELL_TYPE_DATE,
  intlDatetime: CELL_TYPE_DATE,
  numeric: CELL_TYPE_NUMERIC,
  select: CELL_TYPE_SELECT,
  time: CELL_TYPE_TIME,
  intlTime: CELL_TYPE_TIME,
};

/**
 * Changelog entry `type` -> kind label.
 */
export const KIND_LABELS = {
  fixed: 'bug',
  added: 'Type: Feature',
  changed: 'enhancement',
};

/**
 * Labels a person or a CI job owns. Never proposed, even if a rule above would produce them.
 */
export const EXCLUDED_LABEL_PATTERNS = [
  /^Status: /,
  /^Guess: /,
  /^Effort: /,
  /^Impact: /,
  /^ci:/,
  /^docs-sync/,
  /^CLA signed$/,
  /^visual-approved$/,
  /^Requires Manual QA$/,
  /^Breaking change$/,
  /^Blocked$/,
  /^Wontfix$/,
  /^Regression$/,
  /^QA needed$/,
  /^Verified by QA$/,
  /^run-docs-visual$/,
  /^triaged$/,
  /^needs-triage$/,
  /^dependencies$/,
];

const SRC = 'handsontable/src/';
const CELL_TYPE_FOLDERS = [
  { dir: `${SRC}editors/`, suffix: 'Editor' },
  { dir: `${SRC}renderers/`, suffix: 'Renderer' },
  { dir: `${SRC}validators/`, suffix: 'Validator' },
  { dir: `${SRC}cellTypes/`, suffix: 'Type' },
];

/**
 * Proposes the labels for one changed path.
 *
 * @param {string} path A repository-relative path using forward slashes.
 * @returns {string[]} The labels the path implies.
 */
function labelsForPath(path) {
  const labels = [];
  const pluginMatch = path.match(/^handsontable\/src\/plugins\/([^/]+)\//);

  if (pluginMatch && PLUGIN_LABELS[pluginMatch[1]]) {
    labels.push(PLUGIN_LABELS[pluginMatch[1]]);
  }

  CELL_TYPE_FOLDERS.forEach(({ dir, suffix }) => {
    if (!path.startsWith(dir)) {
      return;
    }

    const folder = path.slice(dir.length).split('/')[0];
    const name = folder.endsWith(suffix) ? folder.slice(0, -suffix.length) : folder;

    if (CELL_TYPE_LABELS[name]) {
      labels.push(CELL_TYPE_LABELS[name]);
    }
    if (suffix === 'Editor') {
      labels.push('Editor');
    }
    if (suffix === 'Validator') {
      labels.push('Core: Validation');
    }
  });

  if (path.startsWith(`${SRC}3rdparty/walkontable/`)) {
    labels.push('Core: Walkontable');
  }
  if (path.startsWith(`${SRC}selection/`)) {
    labels.push('Core: Selection');
  }
  if (path.startsWith('wrappers/react-wrapper/')) {
    labels.push('React');
  }
  if (path.startsWith('wrappers/vue3/')) {
    labels.push('Vue 3');
  }
  if (path.startsWith('wrappers/angular-wrapper/')) {
    labels.push('Angular');
  }
  if (path.startsWith('docs/content/')) {
    labels.push('Docs: Content');
  } else if (path.startsWith('docs/')) {
    labels.push('Docs: Tools');
  }
  if (path.endsWith('.d.ts') || path.startsWith('handsontable/types/') || path.endsWith('.types.ts')) {
    labels.push('TypeScript');
  }
  if (path.startsWith('tests/a11y/')) {
    labels.push('Accessibility');
  }
  if (path.startsWith('.github/')) {
    labels.push('Tools');
  }

  return labels;
}

/**
 * Proposes labels for a PR. Pure: no I/O.
 *
 * @param {string[]} paths The changed paths of the PR.
 * @param {string|null|undefined} changelogType The `type` of the PR's changelog entry, if it has one.
 * @param {string[]} existingLabels The label names that exist in the repository.
 * @returns {string[]} Sorted, unique label names, all of which exist in `existingLabels`.
 */
export function proposeLabels(paths, changelogType, existingLabels) {
  const proposed = new Set(paths.flatMap(path => labelsForPath(path.replaceAll('\\', '/'))));

  if (changelogType && Object.hasOwn(KIND_LABELS, changelogType)) {
    proposed.add(KIND_LABELS[changelogType]);
  }

  const existing = new Set(existingLabels);

  return [...proposed]
    .filter(label => existing.has(label))
    .filter(label => !EXCLUDED_LABEL_PATTERNS.some(pattern => pattern.test(label)))
    .sort();
}

/**
 * Parses `git diff --name-status --no-renames` output. A rename shows up as a delete and an add.
 *
 * @param {string} output The raw command output.
 * @returns {{ status: string, path: string }[]}
 */
export function parseNameStatus(output) {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, path] = line.split('\t');

      return { status: status.charAt(0), path };
    });
}

/**
 * Returns the path of the changelog entry the PR adds, if any. A deleted entry (one consumed
 * by a release, for example) is never picked.
 *
 * @param {{ status: string, path: string }[]} changes The changed files of the PR.
 * @returns {string|null}
 */
export function findChangelogPath(changes) {
  const entry = changes.find(({ status, path }) => status !== 'D' && /^\.changelogs\/\d+\.json$/.test(path));

  return entry?.path ?? null;
}

/**
 * Picks the diff base: the `--base` override, else the PR's own base branch, else `develop`.
 *
 * @param {string|undefined} override The `--base` value.
 * @param {string|null} prBaseRef The `baseRefName` of the branch's PR, if it has one.
 * @returns {string}
 */
export function resolveBase(override, prBaseRef) {
  if (override) {
    return override;
  }

  return `origin/${prBaseRef || 'develop'}`;
}

/**
 * Runs a command and returns its stdout.
 *
 * @param {string} command The command.
 * @param {string[]} args The arguments.
 * @returns {Promise<string>}
 */
async function execCommand(command, args) {
  const { stdout } = await execFileAsync(command, args);

  return stdout;
}

/**
 * Reads the `type` field of a changelog entry file.
 *
 * @param {string} path The absolute entry file path.
 * @param {Function} read Reads a file as UTF-8 text.
 * @returns {Promise<string|null>}
 */
async function readChangelogType(path, read) {
  let entry;

  try {
    entry = JSON.parse(await read(path));
  } catch (error) {
    throw new Error(`Cannot read the changelog entry ${path}: ${error.message}`);
  }

  return typeof entry.type === 'string' ? entry.type : null;
}

/**
 * Computes the label proposal: reads the PR base, the git diff, the repository labels, and the
 * changelog entry. The I/O comes in through `io`, so tests can replace it.
 *
 * @param {string[]} argv The CLI arguments.
 * @param {object} [io] The I/O functions.
 * @param {Function} [io.exec] Runs a command, resolves with its stdout.
 * @param {Function} [io.read] Reads a file as UTF-8 text.
 * @param {string} [io.cwd] The directory a `--changelog` path is relative to.
 * @returns {Promise<{ labels: string[], json: boolean }>}
 */
export async function run(argv, {
  exec = execCommand,
  read = path => readFile(path, 'utf8'),
  cwd = process.cwd(),
} = {}) {
  const { values } = parseArgs({
    args: argv,
    options: {
      base: { type: 'string' },
      changelog: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
  });
  let prBaseRef = null;

  if (!values.base) {
    try {
      prBaseRef = JSON.parse(await exec('gh', ['pr', 'view', '--json', 'baseRefName'])).baseRefName;
    } catch {
      // No PR for this branch yet: fall back to develop.
    }
  }

  const base = resolveBase(values.base, prBaseRef);
  const root = (await exec('git', ['rev-parse', '--show-toplevel'])).trim();
  const changes = parseNameStatus(await exec('git', ['diff', '--name-status', '--no-renames', `${base}...HEAD`]));
  const existingLabels = JSON.parse(await exec('gh', ['label', 'list', '--limit', '300', '--json', 'name']))
    .map(({ name }) => name);
  const foundPath = findChangelogPath(changes);
  let changelogPath = null;

  if (values.changelog) {
    changelogPath = resolve(cwd, values.changelog);
  } else if (foundPath) {
    changelogPath = join(root, foundPath);
  }

  const changelogType = changelogPath ? await readChangelogType(changelogPath, read) : null;
  const labels = proposeLabels(changes.map(({ path }) => path), changelogType, existingLabels);

  return { labels, json: values.json };
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  try {
    const { labels, json } = await run(process.argv.slice(2));

    if (json) {
      process.stdout.write(`${JSON.stringify(labels)}\n`);
    } else {
      labels.forEach(label => process.stdout.write(`${label}\n`));
    }
  } catch (error) {
    process.stderr.write(`pr-labels: ${error.message}\n`);
    process.exitCode = 1;
  }
}
