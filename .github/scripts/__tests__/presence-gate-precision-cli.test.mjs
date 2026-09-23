import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// End-to-end runs of the presence-gate CLI for the DEV-3066 rules that depend
// on git plumbing rather than on the pure evaluator: a `Refactor-only:` trailer
// waives only its own commit's files (so `readCommits()` must attribute files
// to commits and skip the merge commit a CI merge ref carries), a deleted test
// is not coverage, and a base branch that moved on after the fork contributes
// nothing to the diff when the gate is handed its live tip.

const CLI = path.join(repoRoot(), '.github/scripts/test-presence-gate.mjs');

const GIT_ENV = (() => {
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Presence Gate Test',
    GIT_AUTHOR_EMAIL: 'presence-gate@test.invalid',
    GIT_COMMITTER_NAME: 'Presence Gate Test',
    GIT_COMMITTER_EMAIL: 'presence-gate@test.invalid',
  };

  for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GATE_BASE', 'GATE_MODE', 'GATE_PR_BODY', 'GATE_PR_BODY_FILE']) {
    delete env[name];
  }

  return env;
})();

const FILE_A = 'handsontable/src/helpers/a.ts';
const FILE_B = 'handsontable/src/helpers/b.ts';
const SPEC = 'tests/e2e/helpers.spec.ts';

/**
 * Run git in the repository.
 *
 * @param {string} cwd The repository root.
 * @param {...string} args Git arguments.
 * @returns {string} Trimmed stdout.
 */
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, env: GIT_ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/**
 * Write a file under the repository, creating its directories.
 *
 * @param {string} root The repository root.
 * @param {string} file Repo-relative path.
 * @param {string} content File content.
 */
function write(root, file, content) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), content);
}

/**
 * Commit everything in the working tree.
 *
 * @param {string} root The repository root.
 * @param {string} message The commit message.
 */
function commit(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
}

/**
 * A repository whose base commit holds two source files and a Playwright spec,
 * on branch `develop`.
 *
 * @returns {string} The repository root.
 */
function baseRepo() {
  const root = mkdtempSync(path.join(tmpdir(), 'presence-gate-precision-'));

  git(root, 'init', '-q', '-b', 'develop');
  write(root, FILE_A, 'export const a = 1;\n');
  write(root, FILE_B, 'export const b = 1;\n');
  write(root, SPEC, 'test(\'b\', async() => {\n  expect(1).toBe(1);\n});\n');
  commit(root, 'base');

  return root;
}

/**
 * Run the CLI in block mode against a base ref.
 *
 * @param {string} root The repository root.
 * @param {string} base GATE_BASE.
 * @returns {{status: number|null, stdout: string}} The run.
 */
function runGate(root, base) {
  const result = spawnSync(process.execPath, [CLI], {
    cwd: root,
    encoding: 'utf8',
    env: { ...GIT_ENV, GATE_BASE: base, GATE_MODE: 'block' },
  });

  return { status: result.status, stdout: result.stdout + result.stderr };
}

test('a Refactor-only trailer waives only the files its own commit changed', (t) => {
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_A, 'export const a = 1; // moved\n');
  commit(root, 'DEV-1: move a\n\nRefactor-only: comment only');
  write(root, FILE_B, 'export const b = 2;\n');
  commit(root, 'DEV-1: change b');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 1, run.stdout);
  assert.ok(run.stdout.includes(`- \`${FILE_B}\``), `the ordinary commit's file needs a test:\n${run.stdout}`);
  assert.ok(!run.stdout.includes(`- \`${FILE_A}\``), `the refactor commit's file is waived:\n${run.stdout}`);
  assert.match(run.stdout, /\*\*core\*\* – needs /, 'the verdict names the package and where its tests go');
});

test('a merge commit in the range (a CI merge ref) does not cancel a waiver', (t) => {
  // In CI the checkout is refs/pull/N/merge: HEAD is a merge commit with no
  // trailer. `git log --name-only` lists no files for a merge commit, and
  // readCommits() also passes --no-merges, so the waiver must survive the
  // shape unchanged. This pins the CI shape end to end; it does not by itself
  // prove --no-merges is needed (measured: it passes without the flag).
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_A, 'export const a = 1; // moved\n');
  commit(root, 'DEV-1: move a\n\nRefactor-only: comment only');
  git(root, 'switch', '-q', 'develop');
  write(root, 'README.md', 'base moved on\n');
  commit(root, 'unrelated base work');
  git(root, 'switch', '-q', '-c', 'merge-ref');
  git(root, 'merge', '-q', '--no-ff', '-m', 'Merge feature into develop', 'feature');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 0, run.stdout);
  assert.match(run.stdout, /every commit that changed them carries a `Refactor-only:` trailer/);
});

test('a source change whose only test change deletes a spec is blocked', (t) => {
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_B, 'export const b = 2;\n');
  git(root, 'rm', '-q', SPEC);
  commit(root, 'DEV-1: change b, drop its spec');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 1, run.stdout);
  assert.ok(run.stdout.includes(`- \`${FILE_B}\``));
  assert.match(run.stdout, /A deleted test does not count/);
});

test('against the base branch\'s live tip, commits the base gained after the fork are not the branch\'s', (t) => {
  // GATE_BASE is the live tip (origin/<base.ref> in CI). The three-dot diff and
  // the two-dot log both stop at the merge-base, so a source file the base
  // added later is neither a change to judge nor a commit to read.
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_B, 'export const b = 2;\n');
  write(root, SPEC, 'test(\'b\', async() => {\n  expect(2).toBe(2);\n});\n');
  commit(root, 'DEV-1: change b with its spec');
  git(root, 'switch', '-q', 'develop');
  write(root, 'handsontable/src/helpers/c.ts', 'export const c = 1;\n');
  commit(root, 'someone else adds c with no test');
  git(root, 'switch', '-q', 'feature');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 0, run.stdout);
  assert.match(run.stdout, /✅ Pass\./);
  assert.ok(!run.stdout.includes('helpers/c.ts'), 'the base\'s later commit is not judged');
});

test('a JSDoc-only edit to a source file passes in block mode; a code edit beside it does not', (t) => {
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, FILE_A, '/**\n * A.\n */\nexport const a = 1;\n');
  commit(root, 'base doc');
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_A, '/**\n * A, with a clearer description.\n */\nexport const a = 1;\n');
  commit(root, 'DEV-1: document a');

  const docs = runGate(root, 'develop');

  assert.equal(docs.status, 0, docs.stdout);
  assert.match(docs.stdout, /changed only in comments and whitespace/);
  assert.ok(docs.stdout.includes(`- \`${FILE_A}\``));

  write(root, FILE_A, '/**\n * A, with a clearer description.\n */\nexport const a = 2;\n');
  commit(root, 'DEV-1: and change it');

  const code = runGate(root, 'develop');

  assert.equal(code.status, 1, code.stdout);
  assert.ok(code.stdout.includes(`- \`${FILE_A}\``));
});

test('an unreadable base is a skip, not a block, even in block mode', (t) => {
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_B, 'export const b = 2;\n');
  commit(root, 'DEV-1: change b');

  const run = runGate(root, 'origin/no-such-branch');

  assert.equal(run.status, 0, run.stdout);
  assert.match(run.stdout, /could not read the diff against "origin\/no-such-branch"[^\n]*skipped/);
});
