import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
test('repoRoot() ignores the git environment a hook exports', () => {
  const expected = repoRoot();
  const { GIT_DIR, GIT_WORK_TREE } = process.env;

  try {
    process.env.GIT_DIR = path.join(expected, '.git/worktrees/does-not-exist');
    process.env.GIT_WORK_TREE = tmpdir();
    assert.equal(repoRoot(), expected);
  } finally {
    if (GIT_DIR === undefined) {
      delete process.env.GIT_DIR;
    } else {
      process.env.GIT_DIR = GIT_DIR;
    }

    if (GIT_WORK_TREE === undefined) {
      delete process.env.GIT_WORK_TREE;
    } else {
      process.env.GIT_WORK_TREE = GIT_WORK_TREE;
    }
  }
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
