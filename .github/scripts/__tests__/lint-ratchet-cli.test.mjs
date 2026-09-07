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
const BASE_SPEC = `${SPEC_DIR}/landedOnTheBase.spec.js`;
const STUB_PATH = 'handsontable/node_modules/eslint/bin/eslint.js';
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
 * carrying a legacy `sleep()`. The tests stage everything (`git add -A`), so the
 * copied tooling and the stub are tracked and DO appear in the whole-branch diff;
 * the CLI's candidate filter (spec/unit files under `handsontable/`) is what keeps
 * those paths out of the findings, which is exactly the behavior under test.
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
 * Commit an in-place `await sleep(50);` at line 4 of the legacy spec (the
 * legacy `sleep()` shifts to line 6) — the shape the ratchet must block, and
 * the one every tooling-gap test starts from so a skip there is provably a
 * skip of a real finding.
 *
 * @param {string} root The fixture root.
 * @returns {string} The commit to diff against (HEAD before the change).
 */
function commitNewSleep(root) {
  const base = git(root, ['rev-parse', 'HEAD']);
  const lines = readFileSync(path.join(root, OLD_SPEC), 'utf8').split('\n');

  lines.splice(3, 0, '    await sleep(50);');
  writeFileSync(path.join(root, OLD_SPEC), lines.join('\n'));
  git(root, ['commit', '-q', '-am', 'add a sleep']);

  return base;
}

/**
 * Fork `feature` off `main`, give it one harmless added line in the legacy spec
 * (so the ratchet has a line of the branch's own to read), then advance `main`
 * with a NEW spec carrying a `sleep()` — a base commit the branch never wrote.
 * Returns the fork commit: the base SHA a PR payload would have frozen.
 *
 * @param {string} root The fixture root.
 * @returns {string} The fork commit.
 */
function forkAndAdvanceBase(root) {
  const fork = git(root, ['rev-parse', 'HEAD']);

  git(root, ['switch', '-q', '-c', 'feature']);

  const lines = readFileSync(path.join(root, OLD_SPEC), 'utf8').split('\n');

  lines.splice(1, 0, '  // a line the branch added');
  writeFileSync(path.join(root, OLD_SPEC), lines.join('\n'));
  git(root, ['commit', '-q', '-am', 'feature: a harmless added line']);

  git(root, ['switch', '-q', 'main']);
  writeFileSync(path.join(root, BASE_SPEC), LEGACY_SPEC);
  git(root, ['add', BASE_SPEC]);
  git(root, ['commit', '-q', '-m', 'base: a spec with a sleep() lands after the fork']);

  return fork;
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
  writeFileSync(
    path.join(root, 'handsontable/src/helpers/timing.ts'),
    'export const sleep = ms => new Promise(r => setTimeout(r, ms));\n',
  );
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

// --- the base must be the LIVE base branch tip, never the event payload's frozen SHA ---

test('CI shape: a refs/pull/N/merge checkout diffed from the live base tip reads only the branch\'s lines', () => {
  const root = createFixtureRepo();
  const fork = forkAndAdvanceBase(root);

  // actions/checkout's default ref on a pull_request run: the PR head merged
  // into the CURRENT base tip, detached. GitHub rebuilds it whenever either
  // side moves, so a "Re-run all jobs" sees a newer one than its payload names.
  git(root, ['switch', '-q', '--detach', 'main']);
  git(root, ['merge', '-q', '--no-ff', '-m', 'refs/pull/N/merge', 'feature']);

  const live = runRatchet(root, [], { GATE_BASE: 'main' });

  assert.equal(live.status, 0, `exit ${live.status}\n${live.stdout}${live.stderr}`);
  assert.deepEqual(reportedLocations(live.stdout), [],
    'the sleep() the BASE added must not be attributed to the branch');
  // ESLint ran — the branch's own added line was in scope and is clean — rather
  // than the "gained no line" fast path: the branch's changes were read.
  assert.match(live.stdout, /no new sleep\(\)/);

  // The defect this pins: the fork (the payload's base.sha) is an ancestor of
  // the merge commit, so merge-base(fork, HEAD) is the fork itself and every
  // base commit after it reads as the branch's. lint.yml therefore fetches the
  // base branch and passes `origin/<base.ref>`, never `base.sha`.
  const stale = runRatchet(root, [], { GATE_BASE: fork });

  assert.equal(stale.status, 1, `exit ${stale.status}\n${stale.stdout}${stale.stderr}`);
  assert.deepEqual(reportedLocations(stale.stdout), [`${BASE_SPEC}:5`]);
});

test('a branch that merged the base after it forked: the live base tip reads only the branch\'s lines', () => {
  const root = createFixtureRepo();
  const fork = forkAndAdvanceBase(root);

  git(root, ['switch', '-q', 'feature']);
  git(root, ['merge', '-q', '--no-ff', '-m', 'merge main into feature', 'main']);

  const live = runRatchet(root, [], { GATE_BASE: 'main' });

  assert.equal(live.status, 0, `exit ${live.status}\n${live.stdout}${live.stderr}`);
  assert.deepEqual(reportedLocations(live.stdout), []);
  assert.match(live.stdout, /no new sleep\(\)/);

  // Pinning the PR head instead of the merge ref would not have helped here:
  // once the base is merged in, the fork SHA is an ancestor of the head too.
  const stale = runRatchet(root, [], { GATE_BASE: fork });

  assert.equal(stale.status, 1, `exit ${stale.status}\n${stale.stdout}${stale.stderr}`);
  assert.deepEqual(reportedLocations(stale.stdout), [`${BASE_SPEC}:5`]);
});

// --- paths: a non-ASCII name must key the same file in the diff and the name list ---

test('a new sleep() in a spec with a non-ASCII name is reported — the path arrives raw, not octal-escaped', () => {
  const root = createFixtureRepo();
  const base = git(root, ['rev-parse', 'HEAD']);
  const spec = `${SPEC_DIR}/café.spec.js`;

  writeFileSync(path.join(root, spec), LEGACY_SPEC);
  git(root, ['add', spec]);
  git(root, ['commit', '-q', '-m', 'add a spec with a non-ASCII name']);

  // The case under test: with git's default quoting the `+++` header escapes
  // the name byte by byte, and a per-byte decode keyed the file as `cafÃ©`.
  const header = git(root, ['diff', '-U0', base, 'HEAD']).split('\n').find(line => line.startsWith('+++ '));

  assert.match(header, /caf\\303\\251\.spec\.js/, 'git quotes the name unless told otherwise');

  const run = runRatchet(root, ['--base', base]);

  assert.equal(run.status, 1, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.deepEqual(reportedLocations(run.stdout), [`${spec}:5`]);
});

// --- tooling gaps: the "never a false block" promise, one branch each ---
// Each starts from the commit the control test below proves IS blocked, so the
// exit 0 here is a skip of a real finding, not an empty run.

test('ESLint not installed: skips with a notice and exit 0 instead of blocking', () => {
  const root = createFixtureRepo();
  const base = commitNewSleep(root);

  rmSync(path.join(root, STUB_PATH));

  const run = runRatchet(root, ['--base', base]);

  assert.equal(run.status, 0, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.match(run.stdout, /not installed/);
  assert.match(run.stdout, /skipped/);
  assert.deepEqual(reportedLocations(run.stdout), []);
});

test('ESLint exiting 2 (a config or parse gap): skips, naming the first stderr line, instead of blocking', () => {
  const root = createFixtureRepo();
  const base = commitNewSleep(root);

  writeFileSync(path.join(root, STUB_PATH), [
    'process.stderr.write("Oops! Something went wrong! ESLint: 8.57.1\\n\\nError: Failed to load plugin");',
    'process.exit(2);',
    '',
  ].join('\n'));

  const run = runRatchet(root, ['--base', base]);

  assert.equal(run.status, 0, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.match(run.stdout, /exited 2/);
  assert.match(run.stdout, /Oops! Something went wrong!/, 'the notice carries ESLint\'s first stderr line');
  assert.match(run.stdout, /skipped/);
  assert.deepEqual(reportedLocations(run.stdout), []);
});

test('unparsable ESLint output: skips with a notice and exit 0 instead of blocking', () => {
  const root = createFixtureRepo();
  const base = commitNewSleep(root);

  writeFileSync(path.join(root, STUB_PATH), 'process.stdout.write("{");\n');

  const run = runRatchet(root, ['--base', base]);

  assert.equal(run.status, 0, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.match(run.stdout, /no parsable JSON/);
  assert.match(run.stdout, /skipped/);
  assert.deepEqual(reportedLocations(run.stdout), []);
});

// --- control: the gate still bites on a plain in-place addition ---

test('a new sleep() added in place (no rename) is reported at its line', () => {
  const root = createFixtureRepo();
  const base = commitNewSleep(root);

  const run = runRatchet(root, ['--base', base]);

  assert.equal(run.status, 1, `exit ${run.status}\n${run.stdout}${run.stderr}`);
  assert.deepEqual(reportedLocations(run.stdout), [`${OLD_SPEC}:4`]);
});
