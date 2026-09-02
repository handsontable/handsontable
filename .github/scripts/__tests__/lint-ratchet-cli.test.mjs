import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The CLI seam: git → candidates → ESLint → intersection → exit code. The pure
// lib has its own unit tests; these run the real script against a throwaway git
// repository, because the defect that motivated them (a pathspec-limited diff
// defeating rename detection) lived entirely in the git call the lib never sees.

const SPEC_DIR = 'handsontable/src/renderers/numericRenderer/__tests__';
const OLD_SPEC = `${SPEC_DIR}/contextMenu.spec.js`;
const NEW_SPEC = `${SPEC_DIR}/contextMenuRenamed.spec.js`;
const SLEEP_RULE = 'handsontable/no-fixed-sleep-in-spec';

/**
 * A frozen-suite spec carrying one legacy `sleep()` — line 5.
 */
const LEGACY_SPEC = [
  'describe(\'numericRenderer context menu\', () => {',
  '  it(\'opens the menu\', async() => {',
  '    handsontable({ contextMenu: true });',
  '    await contextMenu();',
  '    await sleep(304);',
  '    expect(getPlugin(\'contextMenu\').menu.isOpened()).toBe(true);',
  '  });',
  '});',
  '',
].join('\n');

/**
 * A stand-in for ESLint's `--format json` output, installed where the CLI looks
 * for the package's own binary. It reports EVERY `sleep(` call in the files it
 * is handed as a warn-level `no-fixed-sleep-in-spec` message — pre-existing and
 * new alike — so the intersection with the diff is left to the CLI, which is
 * the thing under test. Real ESLint is the same contract with a slower start
 * and a dependency the tooling-tests CI job does not install.
 */
const STUB_ESLINT = `
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const formatAt = args.indexOf('--format');

if (formatAt !== -1) {
  args.splice(formatAt, 2);
}

const results = args.map((file) => {
  const messages = [];

  fs.readFileSync(file, 'utf8').split('\\n').forEach((text, index) => {
    if (/\\bsleep\\(/.test(text)) {
      messages.push({
        ruleId: ${JSON.stringify(SLEEP_RULE)},
        severity: 1,
        message: 'Do not use a fixed sleep() delay.',
        line: index + 1,
        column: 1,
      });
    }
  });

  return {
    filePath: path.resolve(file),
    messages,
    errorCount: 0,
    warningCount: messages.length,
    fatalErrorCount: 0,
  };
});

process.stdout.write(JSON.stringify(results));
`;

// A hook's `GIT_DIR` would make git read the fixture's cwd as someone else's
// work tree; the user's global config (diff.noprefix, diff.renames…) would make
// the run depend on the machine. Identity comes from the environment so the
// fixture needs no config at all.
const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'ratchet test',
  GIT_AUTHOR_EMAIL: 'ratchet@test.invalid',
  GIT_COMMITTER_NAME: 'ratchet test',
  GIT_COMMITTER_EMAIL: 'ratchet@test.invalid',
};

delete GIT_ENV.GIT_DIR;
delete GIT_ENV.GIT_WORK_TREE;
delete GIT_ENV.GIT_INDEX_FILE;

const fixtures = [];

after(() => {
  for (const root of fixtures) {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * Run git inside a fixture repository.
 *
 * @param {string} root The fixture root.
 * @param {string[]} args Git arguments.
 * @returns {string} Trimmed stdout.
 */
function git(root, args) {
  return execFileSync('git', args, {
    cwd: root, env: GIT_ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Build a throwaway repository the CLI takes for "the repo": the script and its
 * lib copied under `.github/scripts/` (`repoRoot()` is anchored to the script's
 * own location, so the copy resolves the fixture as its root), the stub ESLint
 * under `handsontable/node_modules/eslint/bin/eslint.js`, and one committed spec
 * carrying a legacy `sleep()`. Only the spec is tracked; the tooling stays
 * untracked so it never appears in a diff.
 *
 * @returns {string} The fixture root.
 */
function createFixtureRepo() {
  const root = mkdtempSync(path.join(tmpdir(), 'lint-ratchet-cli-'));
  const source = repoRoot();

  fixtures.push(root);

  cpSync(path.join(source, '.github/scripts/lint-ratchet.mjs'), path.join(root, '.github/scripts/lint-ratchet.mjs'));
  cpSync(path.join(source, '.github/scripts/lib'), path.join(root, '.github/scripts/lib'), { recursive: true });

  const eslintDir = path.join(root, 'handsontable/node_modules/eslint');

  mkdirSync(path.join(eslintDir, 'bin'), { recursive: true });
  writeFileSync(path.join(eslintDir, 'package.json'), '{ "name": "eslint", "type": "commonjs" }\n');
  writeFileSync(path.join(eslintDir, 'bin/eslint.js'), STUB_ESLINT);

  mkdirSync(path.join(root, SPEC_DIR), { recursive: true });
  writeFileSync(path.join(root, OLD_SPEC), LEGACY_SPEC);

  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['add', OLD_SPEC]);
  git(root, ['commit', '-q', '-m', 'base: a legacy spec with a sleep()']);

  return root;
}

/**
 * Run the CLI copy inside a fixture.
 *
 * @param {string} root The fixture root.
 * @param {string[]} [args] CLI arguments.
 * @param {object} [env] Extra environment (e.g. `GATE_BASE`).
 * @returns {import('node:child_process').SpawnSyncReturns<string>} The run.
 */
function runRatchet(root, args = [], env = {}) {
  return spawnSync(process.execPath, [path.join(root, '.github/scripts/lint-ratchet.mjs'), ...args], {
    cwd: root, encoding: 'utf8', env: { ...GIT_ENV, ...env },
  });
}

/**
 * The `file:line` pairs the report names.
 *
 * @param {string} stdout The CLI output.
 * @returns {string[]} Reported locations, in report order.
 */
function reportedLocations(stdout) {
  return [...stdout.matchAll(/`([^`\n]+\.(?:spec|unit)\.[jt]s):(\d+)`/g)].map(m => `${m[1]}:${m[2]}`);
}

// --- renames: the diff must see both sides, or every legacy line reads as added ---

test('a pure `git mv` of a spec that carries a legacy sleep() adds no line and passes', () => {
  const root = createFixtureRepo();
  const base = git(root, ['rev-parse', 'HEAD']);

  git(root, ['mv', OLD_SPEC, NEW_SPEC]);
  // Unrelated source noise in the same commit, as a migration PR would carry.
  // It is not a ratcheted file, so it must neither be linted nor counted.
  mkdirSync(path.join(root, 'handsontable/src/helpers'), { recursive: true });
  writeFileSync(path.join(root, 'handsontable/src/helpers/timing.ts'), 'export const sleep = ms => new Promise(r => setTimeout(r, ms));\n');
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'rename the spec']);

  const run = runRatchet(root, ['--base', base]);

  assert.equal(run.status, 0, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.deepEqual(reportedLocations(run.stdout), [], 'the untouched legacy sleep() must not be reported');
  // The fast path: the rename produced no hunk, so the CLI exits before it
  // spawns ESLint at all — the added-line count is taken AFTER the candidate filter.
  assert.match(run.stdout, /gained no line/);
});

test('a rename plus ONE new sleep() reports exactly the new line — not the legacy one that moved with the file', () => {
  const root = createFixtureRepo();
  const base = git(root, ['rev-parse', 'HEAD']);

  git(root, ['mv', OLD_SPEC, NEW_SPEC]);

  const lines = readFileSync(path.join(root, NEW_SPEC), 'utf8').split('\n');

  // New line 3; the legacy sleep() shifts from line 5 to line 6.
  lines.splice(2, 0, '    await sleep(50);');
  writeFileSync(path.join(root, NEW_SPEC), lines.join('\n'));
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'rename the spec and add a sleep']);

  // The stub reports both sleeps, so a single finding below proves the CLI's
  // intersection did the filtering — not the linter.
  const stub = spawnSync(process.execPath, [
    path.join(root, 'handsontable/node_modules/eslint/bin/eslint.js'), '--format', 'json', NEW_SPEC,
  ], { cwd: root, encoding: 'utf8' });

  assert.deepEqual(JSON.parse(stub.stdout)[0].messages.map(m => m.line), [3, 6], 'the stub must flag both sleeps');

  const run = runRatchet(root, ['--base', base]);

  assert.equal(run.status, 1, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.deepEqual(reportedLocations(run.stdout), [`${NEW_SPEC}:3`]);
  assert.match(run.stdout, /no-fixed-sleep-in-spec/);
});

test('GATE_BASE (the CI contract) resolves the same way as --base', () => {
  const root = createFixtureRepo();
  const base = git(root, ['rev-parse', 'HEAD']);

  git(root, ['mv', OLD_SPEC, NEW_SPEC]);
  git(root, ['commit', '-q', '-m', 'rename the spec']);

  const run = runRatchet(root, [], { GATE_BASE: base });

  assert.equal(run.status, 0, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.deepEqual(reportedLocations(run.stdout), []);
});

// --- the base: unresolvable or unrelated means skip, never a diff against a non-ancestor ---

test('an unknown base ref skips with a notice and exit 0', () => {
  const root = createFixtureRepo();
  const run = runRatchet(root, ['--base', 'no-such-ref-xyz']);

  assert.equal(run.status, 0, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.match(run.stdout, /Determinism ratchet: .*skipped/);
  assert.match(run.stdout, /no-such-ref-xyz/, 'the notice names the ref it could not use');
  assert.deepEqual(reportedLocations(run.stdout), []);
});

test('a base that exists but shares no history with HEAD skips instead of diffing against it', () => {
  // The shape of a shallow clone whose base SHA is present but whose history
  // is cut before the fork point: `merge-base` fails while `rev-parse` still
  // succeeds. Diffing straight against that commit reads every line HEAD has
  // and the base lacks — here the whole legacy spec — as added by this branch.
  const root = createFixtureRepo();

  git(root, ['switch', '-q', '--orphan', 'unrelated']);
  writeFileSync(path.join(root, 'README.md'), 'an unrelated root commit\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-q', '-m', 'unrelated root']);

  const unrelated = git(root, ['rev-parse', 'HEAD']);

  git(root, ['switch', '-q', 'main']);

  const run = runRatchet(root, ['--base', unrelated]);

  assert.equal(run.status, 0, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.match(run.stdout, /no merge-base/);
  assert.match(run.stdout, /skipped/);
  assert.deepEqual(reportedLocations(run.stdout), [], 'the legacy sleep() must not be read as added');
});

// --- control: the gate still bites on a plain in-place addition ---

test('a new sleep() added in place (no rename) is reported at its line', () => {
  const root = createFixtureRepo();
  const base = git(root, ['rev-parse', 'HEAD']);
  const lines = readFileSync(path.join(root, OLD_SPEC), 'utf8').split('\n');

  lines.splice(3, 0, '    await sleep(50);'); // new line 4; the legacy one becomes line 6
  writeFileSync(path.join(root, OLD_SPEC), lines.join('\n'));
  git(root, ['commit', '-q', '-am', 'add a sleep']);

  const run = runRatchet(root, ['--base', base]);

  assert.equal(run.status, 1, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.deepEqual(reportedLocations(run.stdout), [`${OLD_SPEC}:4`]);
});
