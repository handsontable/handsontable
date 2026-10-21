import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from 'node:fs';
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
function runGate(root, base, env = {}) {
  // GITHUB_ACTIONS keeps the CLI from asking `gh` for a PR body, so a run
  // never depends on the developer's gh login; a test that wants the fallback
  // passes GITHUB_ACTIONS: undefined.
  const merged = { ...GIT_ENV, GITHUB_ACTIONS: 'true', GATE_BASE: base, GATE_MODE: 'block', ...env };

  for (const [name, value] of Object.entries(merged)) {
    if (value === undefined) {
      delete merged[name];
    }
  }

  const result = spawnSync(process.execPath, [CLI], { cwd: root, encoding: 'utf8', env: merged });

  return { status: result.status, stdout: result.stdout + result.stderr };
}

test('a Refactor-only trailer waives only the files its own commit changed', (t) => {
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_A, 'export const a = 1; // moved\n');
  commit(root, 'DEV-1: move a\n\nRefactor-only: comment edit only');
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
  commit(root, 'DEV-1: move a\n\nRefactor-only: comment edit only');
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

test('a wrapper prop-type change is blocked, and the verdict asks for a type test before a waiver', (t) => {
  // The replay's two real React misses: a prop type changed, and the only
  // test beside it was core's. The verdict must not read as "types need no
  // test" – a public type change needs a type test in its own package.
  const root = baseRepo();
  const PROPS = 'wrappers/react-wrapper/src/types.tsx';

  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, PROPS, 'export interface HotTableProps {\n  id?: string;\n}\n');
  commit(root, 'wrapper props');
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, PROPS, 'export interface HotTableProps {\n  id?: string;\n  className?: string;\n}\n');
  write(root, SPEC, 'test(\'b\', async() => {\n  expect(2).toBe(2);\n});\n');
  commit(root, 'DEV-1: add the className prop');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 1, run.stdout);
  assert.match(run.stdout, /\*\*react-wrapper\*\* – needs /, 'a core test does not cover the wrapper');
  assert.ok(run.stdout.includes(`- \`${PROPS}\``), run.stdout);

  const typeHint = run.stdout.indexOf('**A public type change**');
  const waiverHint = run.stdout.indexOf('**A refactor or an internal non-runtime change**');

  assert.ok(typeHint !== -1 && waiverHint > typeHint, `the type-test route comes before the waiver:\n${run.stdout}`);
  assert.match(run.stdout, /needs a type test: a `\*\.types\.ts` in the package whose types changed/);
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

// --- review round ---
test('renaming a file in a refactor commit does not launder an untrailered edit to it', (t) => {
  // Reported in review, reproduced here: edit a.ts, then `git mv a.ts b.ts`
  // in a Refactor-only commit; b.ts used to pass as waived.
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_A, 'export const a = 999;\n');
  commit(root, 'DEV-1: change a');
  git(root, 'mv', FILE_A, 'handsontable/src/helpers/moved.ts');
  commit(root, 'DEV-1: move a\n\nRefactor-only: rename with no edits');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 1, run.stdout);
  assert.match(
    run.stdout,
    /- `handsontable\/src\/helpers\/moved\.ts` – changed without a trailer in `[0-9a-f]{9}` DEV-1: change a/,
  );
});

test('a conflict resolution in a merge is not waived; a clean merge of the base still is', (t) => {
  // Reported in review: with --no-merges a merge's conflict resolution was
  // invisible, so an edit it made to a file a refactor commit also touched was
  // waived. `git show --cc` keeps exactly the hunks the merge wrote itself.
  const root = baseRepo();
  const lines = l3 => `export const a = 1;\nconst l2 = 2;\n${l3}\nconst l4 = 4;\nconst l5 = 5;\n`;

  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, FILE_A, lines('const l3 = 3;'));
  commit(root, 'base a');
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_A, lines('const l3 = 3; // note'));
  commit(root, 'DEV-1: note l3\n\nRefactor-only: comment edit only');
  git(root, 'switch', '-q', 'develop');
  write(root, FILE_B, 'export const b = 1; // develop\n');
  commit(root, 'develop edits b');
  git(root, 'switch', '-q', 'feature');
  git(root, 'merge', '-q', '--no-edit', 'develop');

  const clean = runGate(root, 'develop');

  assert.equal(clean.status, 0, `a clean merge writes nothing of its own:\n${clean.stdout}`);

  git(root, 'switch', '-q', 'develop');
  write(root, FILE_A, lines('const l3 = 30;'));
  commit(root, 'develop edits l3');
  git(root, 'switch', '-q', 'feature');
  // Both sides changed l3, so the merge conflicts; the resolution writes a
  // value neither side had.
  assert.notEqual(spawnSync('git', ['merge', '--no-edit', 'develop'], { cwd: root, env: GIT_ENV }).status, 0,
    'the scenario needs a real conflict');
  write(root, FILE_A, lines('const l3 = 999; // note'));
  git(root, 'add', FILE_A);
  git(root, 'commit', '-q', '--no-edit');
  assert.equal(git(root, 'rev-list', '--parents', '-n1', 'HEAD').split(' ').length, 3, 'HEAD is a merge commit');

  const evil = runGate(root, 'develop');

  assert.equal(evil.status, 1, `the resolution is the merge's own edit:\n${evil.stdout}`);
  assert.match(evil.stdout, /changed without a trailer in `[0-9a-f]{9}` Merge branch 'develop' into feature \(merge\)/);
});

test('[refactor-only: <reason>] in the PR description waives a pushed, untrailered commit', (t) => {
  // Reported in review: once a refactor commit is pushed without the trailer,
  // no later commit can fix it and a force-push is forbidden.
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_B, 'export const b = 1; // types only\n');
  commit(root, 'DEV-1: tighten b');

  const blocked = runGate(root, 'develop');

  assert.equal(blocked.status, 1, blocked.stdout);
  assert.match(blocked.stdout, /write `\[refactor-only: <reason>\]` in the PR description/);

  const waived = runGate(root, 'develop', {
    GATE_PR_BODY: 'Context.\n\n[refactor-only: types only, no runtime change]\n',
  });

  assert.equal(waived.status, 0, waived.stdout);
  assert.match(
    waived.stdout,
    /the PR description waives these source files: `\[refactor-only: types only, no runtime change\]`/,
  );

  const commented = runGate(root, 'develop', { GATE_PR_BODY: '<!-- [refactor-only: hidden in a comment] -->' });

  assert.equal(commented.status, 1, 'a waiver inside an HTML comment is inert');
});

test('pasting the red verdict, or its placeholder trailer, waives nothing', (t) => {
  // Reported in review: the verdict tells the author to write
  // `[refactor-only: <reason>]`; a PR description that quotes the verdict
  // carries that placeholder and used to turn the job green.
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_B, 'export const b = 2;\n');
  commit(root, 'DEV-1: change b');

  const blocked = runGate(root, 'develop');

  assert.equal(blocked.status, 1, blocked.stdout);

  const pasted = runGate(root, 'develop', { GATE_PR_BODY: `Context.\n\nCI output:\n\n${blocked.stdout}\n` });

  assert.equal(pasted.status, 1, `a pasted verdict is not a waiver:\n${pasted.stdout}`);

  write(root, FILE_A, 'export const a = 2;\n');
  commit(root, 'DEV-1: change a\n\nRefactor-only: <reason>');

  const trailer = runGate(root, 'develop');

  assert.equal(trailer.status, 1, trailer.stdout);
  assert.ok(trailer.stdout.includes(`- \`${FILE_A}\``), `a placeholder trailer declares nothing:\n${trailer.stdout}`);
});

test('a description waiver quoted as code, or with too few words, waives nothing; as plain text it does', (t) => {
  // Reported in review: `[refactor-only: TBD]` and a waiver inside a code
  // fence both turned the job green.
  const root = baseRepo();
  const waiver = '[refactor-only: moved the helper into its own file]';

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_B, 'export const b = 2;\n');
  commit(root, 'DEV-1: change b');

  for (const body of [`Example:\n\n\`\`\`\n${waiver}\n\`\`\`\n`, `Write \`${waiver}\`.`, '[refactor-only: TBD]']) {
    const run = runGate(root, 'develop', { GATE_PR_BODY: body });

    assert.equal(run.status, 1, `${JSON.stringify(body)} waives nothing:\n${run.stdout}`);
    assert.match(run.stdout, /at least three words/, 'the verdict says what a reason needs');
    assert.match(run.stdout, /one inside code or an HTML comment is a quotation/);
  }

  const plain = runGate(root, 'develop', { GATE_PR_BODY: `Context.\n\n${waiver}\n` });

  assert.equal(plain.status, 0, plain.stdout);
});

test('locally, a failing verdict asks gh for the PR body, so pre-push honors a waiver written after a push', (t) => {
  const root = baseRepo();
  const bin = mkdtempSync(path.join(tmpdir(), 'presence-gate-gh-'));

  t.after(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(bin, { recursive: true, force: true });
  });
  writeFileSync(path.join(bin, 'gh'), '#!/bin/sh\necho "[refactor-only: from the live body]"\n');
  chmodSync(path.join(bin, 'gh'), 0o755);
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, FILE_B, 'export const b = 1; // types only\n');
  commit(root, 'DEV-1: tighten b');

  const run = runGate(root, 'develop', {
    GITHUB_ACTIONS: undefined,
    PATH: `${bin}${path.delimiter}${process.env.PATH}`,
  });

  assert.equal(run.status, 0, run.stdout);
  assert.match(run.stdout, /`\[refactor-only: from the live body\]`/);
});

test('a non-ASCII source path is still source, and still needs a test', (t) => {
  // Reported in review: without -z the path came back quoted, isSource missed
  // it, and it needed no test.
  const root = baseRepo();
  const file = 'handsontable/src/helpers/zażółć.ts';

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, file, 'export const z = 1;\n');
  commit(root, 'DEV-1: add z');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 1, run.stdout);
  assert.ok(run.stdout.includes(`- \`${file}\``), run.stdout);
});

test('a .tsx file is judged as code: JSX text can look like a comment', (t) => {
  // Reported in review: `// docs link` inside an <a> is rendered text.
  const root = baseRepo();
  const file = 'wrappers/react-wrapper/src/link.tsx';

  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, file, 'export const L = () => (\n  <a href="#">\n    // docs link\n  </a>\n);\n');
  commit(root, 'base link');
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, file, 'export const L = () => (\n  <a href="#">\n    // read the docs\n  </a>\n);\n');
  commit(root, 'DEV-1: reword the link');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 1, run.stdout);
  assert.doesNotMatch(run.stdout, /changed only in comments/);
});

test('a translation dictionary needs no test', (t) => {
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  write(root, 'handsontable/src/i18n/languages/fa-IR.ts', 'export default { a: "b" };\n');
  commit(root, 'DEV-1: add Persian');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 0, run.stdout);
});

test('a diff too large for a 1 MB buffer is read, not skipped', (t) => {
  // Reported in review: readChanges used execSync's default 1 MB buffer, so a
  // big diff threw ENOBUFS and the catch turned it into a green skip.
  const root = baseRepo();

  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'switch', '-q', '-c', 'feature');
  mkdirSync(path.join(root, 'docs/bulk'), { recursive: true });
  for (let i = 0; i < 24000; i += 1) {
    writeFileSync(path.join(root, `docs/bulk/page-with-a-long-enough-name-${String(i).padStart(5, '0')}.md`), '');
  }
  write(root, FILE_B, 'export const b = 2;\n');
  commit(root, 'DEV-1: change b beside a big docs import');

  const run = runGate(root, 'develop');

  assert.equal(run.status, 1, run.stdout.slice(0, 2000));
  assert.ok(run.stdout.includes(`- \`${FILE_B}\``));
});

test('a rename, a move into source, a diff git calls binary, and a theme file are judged as code', (t) => {
  // Reported by the red team: each passed as "changed only in comments".
  const root = baseRepo();
  const LIMIT = 'handsontable/src/helpers/limit.ts';
  const THEME = 'handsontable/src/themes/theme/main.ts';
  const MOVED = 'handsontable/src/helpers/sample.ts';

  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, LIMIT, 'export function limit() {\n  return 10;\n}\n');
  write(root, THEME, 'import { a } from "./a";\n\nexport default a;\n');
  write(root, 'tests/e2e/helpers/sample.ts', 'export const sample = 1;\n');
  commit(root, 'more base');

  const judge = (edit) => {
    git(root, 'switch', '-q', '-C', 'feature', 'develop');
    edit();
    commit(root, 'DEV-1: edit');

    return runGate(root, 'develop');
  };
  const cases = {
    'a pure rename': [() => git(root, 'mv', FILE_A, 'handsontable/src/helpers/renamed.ts'),
      'handsontable/src/helpers/renamed.ts'],
    'a move from tests into source': [() => git(root, 'mv', 'tests/e2e/helpers/sample.ts', MOVED), MOVED],
    'a diff git calls binary': [() => {
      write(root, '.gitattributes', '*.ts -diff\n');
      write(root, LIMIT, 'export function limit() {\n  return\n  10;\n}\n'); // ASI: now returns undefined
    }, LIMIT],
    'a header comment on a theme file': [() => write(root, THEME, `/**\n * The main theme.\n */\n${readTheme()}`), THEME],
  };

  function readTheme() {
    return git(root, 'show', `develop:${THEME}`);
  }

  for (const [name, [edit, file]] of Object.entries(cases)) {
    const run = judge(edit);

    assert.equal(run.status, 1, `${name}:\n${run.stdout}`);
    assert.ok(run.stdout.includes(`- \`${file}\``), `${name} names the file:\n${run.stdout}`);
    assert.ok(!run.stdout.includes('changed only in comments'), `${name} is not comment-only:\n${run.stdout}`);
  }
});
