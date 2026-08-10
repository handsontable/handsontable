import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { repoRoot, gitDir } from '../lib/repo-root.mjs';

// The root is asserted against files that only exist at the repository root —
// NOT against `git rev-parse --show-toplevel`, which is the very thing that
// reports the wrong directory under GIT_DIR and would make this test inherit the
// bug it exists to catch.
test('repoRoot() points at the repository root, from any cwd', () => {
  const root = repoRoot();

  assert.ok(existsSync(path.join(root, 'lefthook.yml')), `${root} has no lefthook.yml`);
  assert.ok(existsSync(path.join(root, 'pnpm-workspace.yaml')), `${root} has no pnpm-workspace.yaml`);
  assert.ok(existsSync(path.join(root, '.github/scripts/lib/repo-root.mjs')));

  const cwd = process.cwd();

  try {
    process.chdir(path.join(root, 'scripts'));
    assert.equal(repoRoot(), root);
  } finally {
    process.chdir(cwd);
  }
});

// The regression: git hooks export GIT_DIR (in a worktree, pointing at
// `<main>/.git/worktrees/<name>`), and with it set `--show-toplevel` returns the
// cwd instead of the work tree — which made pre-push resolve `<root>/scripts` as
// the root and crash with MODULE_NOT_FOUND before any gate ran.
//
// Run in a CHILD process, not by mutating `process.env` here: the module derives
// its root once, at import time. Setting the variable after this file imported it
// would only reject a call-time git-derived implementation, and let a load-time
// one (`const ROOT = execSync('git rev-parse --show-toplevel')`) pass while still
// breaking in every real hook, where GIT_DIR exists from process start. The cwd
// is a SUBDIRECTORY for the same reason — from the root itself, even the broken
// resolution returns the right answer.
test('repoRoot() ignores the git environment a hook exports', () => {
  const expected = repoRoot();
  const moduleUrl = pathToFileURL(path.join(expected, '.github/scripts/lib/repo-root.mjs')).href;
  const printed = execFileSync(
    process.execPath,
    ['-e', `import(${JSON.stringify(moduleUrl)}).then(m => process.stdout.write(m.repoRoot()))`],
    {
      cwd: path.join(expected, 'scripts'),
      encoding: 'utf8',
      env: { ...process.env, GIT_DIR: path.join(expected, '.git/worktrees/does-not-exist') },
    }
  );

  assert.equal(printed.trim(), expected);
});

test('gitDir() returns <root>/.git in a normal clone', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'repo-root-clone-'));

  mkdirSync(path.join(root, '.git'), { recursive: true });

  assert.equal(gitDir(root), path.join(root, '.git'));
});

test('gitDir() follows the `gitdir:` pointer of a linked worktree', () => {
  const main = mkdtempSync(path.join(tmpdir(), 'repo-root-main-'));
  const wt = mkdtempSync(path.join(tmpdir(), 'repo-root-wt-'));
  const linked = path.join(main, '.git/worktrees/wt');

  mkdirSync(linked, { recursive: true });
  // In a linked worktree `.git` is a FILE, not a directory.
  writeFileSync(path.join(wt, '.git'), `gitdir: ${linked}\n`);

  assert.equal(gitDir(wt), linked);
});

test('gitDir() resolves a relative `gitdir:` pointer against the root', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'repo-root-rel-'));

  mkdirSync(path.join(root, 'nested/gitdir'), { recursive: true });
  writeFileSync(path.join(root, '.git'), 'gitdir: nested/gitdir\n');

  assert.equal(gitDir(root), path.join(root, 'nested/gitdir'));
});

test('gitDir() returns null outside a checkout', () => {
  assert.equal(gitDir(mkdtempSync(path.join(tmpdir(), 'repo-root-bare-'))), null);
});
