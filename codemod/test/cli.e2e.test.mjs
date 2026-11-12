import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { SAMPLE_FILES, createSampleProject, git } from './helpers/sample-project.mjs';

const BIN = fileURLToPath(new URL('../bin/handsontable-codemod.mjs', import.meta.url));
const RANGE = ['--from', '17.1', '--to', '18.1'];
const GUIDE = 'https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0';
const MIGRATED = [
  'package.json',
  'src/App.tsx',
  'src/Grid.vue',
  'src/angular.component.ts',
  'src/grid.js',
  'src/theme.scss',
  'src/types.ts',
];
const UNTOUCHED = [
  'src/angular.component.html',
  'src/util.js',
  'dist/bundle.js',
  'node_modules/other-lib/index.js',
  '.gitignore',
];

/**
 * Run the real executable in a project.
 *
 * @param {string} dir Project directory.
 * @param {string[]} args Arguments after `migrate`.
 * @returns {{status: number, stdout: string, stderr: string}} The exit code and the output.
 */
function migrate(dir, args) {
  const result = spawnSync(process.execPath, [BIN, 'migrate', ...args], { cwd: dir, encoding: 'utf8' });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/**
 * Read a project file.
 *
 * @param {string} dir Project directory.
 * @param {string} name Project-relative path.
 * @returns {Promise<string>} The text.
 */
function read(dir, name) {
  return readFile(join(dir, name), 'utf8');
}

/**
 * Assert that files still hold the text they were created with.
 *
 * @param {string} dir Project directory.
 * @param {string[]} names Project-relative paths that are in `SAMPLE_FILES`.
 * @returns {Promise<void>}
 */
async function assertUntouched(dir, names) {
  for (const name of names) {
    assert.equal(await read(dir, name), SAMPLE_FILES[name], `${name} must stay byte for byte the same`);
  }
}

/**
 * Names of the tracked files that differ from the last commit.
 *
 * @param {string} dir Project directory.
 * @returns {string[]} Sorted paths.
 */
function changedFiles(dir) {
  return git(dir, ['diff', '--name-only']).split('\n').filter(Boolean).sort();
}

/**
 * Run a test body with a fresh sample project and remove it afterwards.
 *
 * @param {(dir: string) => Promise<void>} body Test body.
 * @param {Record<string, string>} [extra] Files to add to the project before its commit.
 * @returns {Promise<void>}
 */
async function withProject(body, extra) {
  const dir = await createSampleProject(extra);

  try {
    await body(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe('the CLI on a 17.1 project', () => {
  it('refuses a dirty tree with exit code 2 and writes nothing', () => withProject(async(dir) => {
    await writeFile(join(dir, 'src/untracked.txt'), 'x');

    const result = migrate(dir, RANGE);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /uncommitted change/);
    assert.deepEqual(changedFiles(dir), []);
    await assertUntouched(dir, [...MIGRATED, ...UNTOUCHED]);
  }));

  it('prints a diff with --dry-run and writes nothing', () => withProject(async(dir) => {
    const result = migrate(dir, [...RANGE, '--dry-run']);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /^--- a\/src\/grid\.js$/m);
    assert.match(result.stdout, /^\+\+\+ b\/package\.json$/m);
    assert.match(result.stdout, /^\+ {6}locale: 'de-DE',$/m);
    assert.match(result.stdout, /^Summary: 7 files would change, /m);
    assert.doesNotMatch(result.stdout, /^Next:/m);
    assert.deepEqual(changedFiles(dir), []);
    await assertUntouched(dir, [...MIGRATED, ...UNTOUCHED]);
  }));

  it('migrates every kind of file, leaves the rest alone, and writes the report', () => withProject(async(dir) => {
    const result = migrate(dir, [...RANGE, '--report', 'report.md']);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^Summary: 7 files changed, /m);
    assert.match(result.stdout, /^Next: run your formatter and linter on the changed files\.$/m);
    assert.match(result.stdout, /^Next: run tsc and your tests\.$/m);
    assert.match(result.stdout, /^Next: work through the \d+ manual steps in the report\. Find the markers with: /m);
    assert.ok(result.stdout.includes('git grep "TODO(handsontable-codemod"'));
    assert.deepEqual(changedFiles(dir), MIGRATED);
    await assertUntouched(dir, UNTOUCHED);

    const manifest = JSON.parse(await read(dir, 'package.json'));

    assert.equal(manifest.dependencies.handsontable, '^18.1.0');
    assert.equal(manifest.dependencies['@handsontable/react-wrapper'], '^18.1.0');
    assert.equal(manifest.dependencies.react, '^18.0.0');

    const grid = await read(dir, 'src/grid.js');

    assert.match(grid, /^ {6}locale: 'de-DE',$/m);
    assert.doesNotMatch(grid, /culture|correctFormat: true/);
    assert.match(grid, /pattern: '0,0\.00 \$'/);
    assert.match(grid, /^ {6}\/\/ TODO\(handsontable-codemod 18\.0\.0\/correct-format-removed\): Deleted correctF/m);
    assert.match(grid, /dateFormat: 'DD\/MM\/YYYY'/);

    const types = await read(dir, 'src/types.ts');

    assert.match(types, /^import type \{ CellValue, RowObject, CellCoords \} from 'handsontable';$/m);
    assert.match(types, /^export let coords: CellCoords;$/m);
    assert.match(types, /^\/\/ TODO\(handsontable-codemod 18\.0\.0\/type-sortordertype\): /m);

    const app = await read(dir, 'src/App.tsx');

    assert.match(app, /^ {8}locale="ja-JP"$/m);
    assert.doesNotMatch(app, /culture/);
    assert.match(app, /licenseKey="non-commercial-and-evaluation"/);

    assert.match(await read(dir, 'src/angular.component.ts'), /^ {6}locale: 'fr-FR',$/m);

    const vue = await read(dir, 'src/Grid.vue');

    assert.match(vue, /^import type \{ GridSettings, CellValue \} from 'handsontable\/settings';$/m);
    assert.match(vue, /^ {4}locale: 'de-DE',$/m);
    assert.match(vue, /^ {2}--ht-border-radius: 8px;$/m);
    assert.doesNotMatch(vue, /--ht-wrapper-border-radius/);

    const theme = await read(dir, 'src/theme.scss');

    assert.match(theme, /^ {2}--ht-border-radius: 6px;$/m);
    assert.match(theme, /^ {2}\/\* TODO\(handsontable-codemod 18\.0\.0\/css-wrapper-border-width\): /m);
    assert.match(theme, /\*\/\n {2}--ht-wrapper-border-width: 1px;$/m);

    const report = await read(dir, 'report.md');

    assert.match(report, /^## 18\.0\.0\/numbro-pattern$/m);
    assert.ok(report.includes(`Guide: ${GUIDE}#`));
    assert.match(report, /^# Handsontable migration report: 17\.1 to 18\.1\.0 \(\d{4}-\d{2}-\d{2}\)$/m);
    assert.equal(report.match(/Handsontable 18\.0 removed Numbro\.js/g).length, 1);
    assert.match(report, /^- \[ \] src\/grid\.js:7$/m);
    assert.match(report, /^- \[ \] src\/App\.tsx:\d+$/m);
    assert.match(report, /^- \[ \] src\/angular\.component\.html:1 Rename --ht-wrapper-border-radius to /m);
    assert.ok(report.includes('- [x] package.json Updated handsontable in dependencies from "^17.1.0" to "^18.1.0".'));
  }));

  it('changes nothing on a second run', () => withProject(async(dir) => {
    assert.equal(migrate(dir, RANGE).status, 0);
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-q', '-m', 'migrate']);

    const again = migrate(dir, RANGE);

    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /^Summary: 0 files changed, 0 rewrites applied, /m);
    assert.doesNotMatch(again.stdout, /^Next:/m);
    assert.deepEqual(changedFiles(dir), []);
    assert.equal(git(dir, ['status', '--porcelain']), '');
  }));

  it('runs only the rule that --only names', () => withProject(async(dir) => {
    const result = migrate(dir, [...RANGE, '--only', '18.0.0/css-wrapper-border-radius']);

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(changedFiles(dir), ['src/Grid.vue', 'src/theme.scss']);
    const theme = await read(dir, 'src/theme.scss');

    assert.match(theme, /^ {2}--ht-border-radius: 6px;\n {2}--ht-wrapper-border-width: 1px;$/m);
    assert.doesNotMatch(theme, /TODO/);
    assert.match(await read(dir, 'src/Grid.vue'), /culture: 'de-DE'/);
    await assertUntouched(dir, ['package.json', 'src/grid.js', 'src/types.ts', ...UNTOUCHED]);
  }));

  it('lists the rules of the range and says which ones rewrite', () => withProject(async(dir) => {
    const result = migrate(dir, [...RANGE, '--list']);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^18\.0\.0\/css-wrapper-border-radius +cssVariable +rewrite$/m);
    assert.match(result.stdout, /^18\.0\.0\/css-wrapper-border-width +cssVariable +report$/m);
    assert.match(result.stdout, /^\d+ rules: \d+ rewrite, \d+ report\.$/m);
    assert.deepEqual(changedFiles(dir), []);
  }));

  it('detects --from from the package.json range when it is omitted', () => withProject(async(dir) => {
    const result = migrate(dir, []);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /Detected --from 17\.1\.0 \(package\.json dependencies\)\./);
    assert.equal(JSON.parse(await read(dir, 'package.json')).dependencies.handsontable, '^18.1.0');
  }));

  it('prefers the installed package to the package.json range when it detects --from', () => withProject(async(dir) => {
    const result = migrate(dir, []);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /Detected --from 17\.1\.0 \(node_modules\/handsontable\)\./);
    assert.equal(JSON.parse(await read(dir, 'package.json')).dependencies.handsontable, '^18.1.0');
  }, { 'node_modules/handsontable/package.json': `${JSON.stringify({ name: 'handsontable', version: '17.1.0' })}\n` }));

  it('reports a file with a syntax error, migrates the others, and exits with 1', () => withProject(async(dir) => {
    const result = migrate(dir, RANGE);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /^parse-error \(1 warning\)$/m);
    assert.match(result.stdout, /\[warning\] src\/broken\.js:\d+ {2}The file could not be parsed and was skipped/);
    assert.deepEqual(changedFiles(dir), MIGRATED);
    assert.equal(await read(dir, 'src/broken.js'), 'import Handsontable from \'handsontable\';\nconst broken = {;\n');
  }, { 'src/broken.js': 'import Handsontable from \'handsontable\';\nconst broken = {;\n' }));
});
