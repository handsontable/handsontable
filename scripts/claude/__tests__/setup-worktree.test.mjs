import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import path from 'node:path';
import {
  checkoutRootFor,
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

test('projectStateCandidates prefers the reading that replaces underscores', () => {
  // Verified against a recorded session: the checkout
  // `…/worktrees/feature+DEV-1656_Autocomplete-dropdown-flex-layout` is stored
  // as `…-feature-DEV-1656-Autocomplete-dropdown-flex-layout`. Claude Code
  // replaces every non-alphanumeric character, underscores included.
  //
  // This repository names branches `feature/DEV-xxxx_Name`, so most worktree
  // directories contain an underscore. Preferring a spelling that keeps it would
  // put the memory link where Claude Code never reads, with no symptom at all.
  const candidates = projectStateCandidates(`${MAIN}/.claude/worktrees/fix_DEV-2562`);

  assert.equal(candidates.length, 2);
  assert.ok(candidates[0].endsWith('fix-DEV-2562'), 'preferred reading replaces the underscore');
  assert.ok(candidates[1].endsWith('fix_DEV-2562'), 'narrower historical reading keeps it');
  assert.notEqual(candidates[0], candidates[1]);
});

test('projectStateCandidates reproduces the recorded slug exactly', () => {
  // The full observed pair, kept verbatim so a future change to the encoding
  // cannot pass by agreeing with itself.
  const checkout = '/Users/budnix/Documents/Projects/handsontable-develop'
    + '/.claude/worktrees/feature+DEV-1656_Autocomplete-dropdown-flex-layout';
  const [preferred] = projectStateCandidates(checkout);

  assert.equal(
    path.basename(preferred),
    '-Users-budnix-Documents-Projects-handsontable-develop'
    + '--claude-worktrees-feature-DEV-1656-Autocomplete-dropdown-flex-layout'
  );
});

test('checkoutRootFor rejects a missing or non-string cwd', () => {
  // The SessionStart hook payload is the only signal that follows the session
  // into a worktree, but it is external input: a malformed one must fall back,
  // never throw and take the session's start with it.
  assert.equal(checkoutRootFor(undefined), null);
  assert.equal(checkoutRootFor(''), null);
  assert.equal(checkoutRootFor(42), null);
  assert.equal(checkoutRootFor({}), null);
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
