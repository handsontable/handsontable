import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import path from 'node:path';
import {
  isWorktreeGitDir,
  projectStateCandidates,
  worktreeRootFromGitDir,
} from '../setup-worktree.mjs';

const MAIN = '/Users/dan/hoc/handsontable';

test('isWorktreeGitDir tells a linked worktree from a normal clone', () => {
  // A linked worktree's git directory always sits under `<main>/.git/worktrees/`.
  assert.equal(isWorktreeGitDir(`${MAIN}/.git/worktrees/issue-9063`), true);

  // A normal clone's is `<root>/.git` — the bootstrap must stay inert there, so
  // that nobody who works without worktrees is affected.
  assert.equal(isWorktreeGitDir(`${MAIN}/.git`), false);

  // `gitDir()` returns null when the root is not a checkout at all.
  assert.equal(isWorktreeGitDir(null), false);
});

test('worktreeRootFromGitDir recovers the owning checkout', () => {
  assert.equal(worktreeRootFromGitDir(`${MAIN}/.git/worktrees/issue-9063`), MAIN);
});

test('projectStateCandidates replaces dots as well as separators', () => {
  const base = path.join(homedir(), '.claude', 'projects');
  const [preferred] = projectStateCandidates(`${MAIN}/.claude/worktrees/issue-9063`);

  // The dot matters: worktrees live under `.claude/`, which Claude Code writes
  // as `--claude`. Replacing separators alone yields a directory that does not
  // exist, and the memory link would land where nothing reads it.
  assert.equal(
    preferred,
    path.join(base, '-Users-dan-hoc-handsontable--claude-worktrees-issue-9063')
  );
  assert.ok(preferred.includes('--claude'), 'expected the dot to become a dash');
});

test('projectStateCandidates offers a fallback for characters we have not observed', () => {
  // Whether Claude Code also rewrites an underscore (legal in a worktree name)
  // or a Windows drive colon is NOT established. Both readings are returned so
  // the caller can pick whichever exists, instead of guessing and silently
  // linking into a directory nothing reads.
  const candidates = projectStateCandidates(`${MAIN}/.claude/worktrees/fix_DEV-2562`);

  assert.equal(candidates.length, 2);
  assert.ok(candidates[0].endsWith('fix_DEV-2562'), 'preferred reading keeps the underscore');
  assert.ok(candidates[1].endsWith('fix-DEV-2562'), 'fallback reading replaces it');
  assert.notEqual(candidates[0], candidates[1]);
});

test('projectStateCandidates collapses no path to a bare projects directory', () => {
  // A candidate equal to the projects root would make the bootstrap link or
  // create state over every project's directory at once.
  const base = path.join(homedir(), '.claude', 'projects');

  for (const candidate of projectStateCandidates(MAIN)) {
    assert.notEqual(candidate, base);
    assert.ok(candidate.startsWith(`${base}${path.sep}`));
  }
});
