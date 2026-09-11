import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  SYNC_COMMITTER, applyCommits, git, hasForeignCommits, recoverFromFailedPick, resetSyncBranch,
} from '../lib/docs-sync/git-apply.mjs';

/**
 * A repository with `prod` and `develop` that share a base, where develop has a
 * clean pick, a conflicting pick, a modify/delete pick, and a pick prod already
 * carries.
 */
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'docs-sync-git-'));
  const env = {
    ...process.env,
    GIT_DIR: undefined,
    GIT_AUTHOR_NAME: 'Author', GIT_AUTHOR_EMAIL: 'author@example.com',
    GIT_COMMITTER_NAME: 'Author', GIT_COMMITTER_EMAIL: 'author@example.com',
  };
  const run = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', env }).trim();
  const write = (rel, text) => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), text);
  };

  run(['init', '-q', '-b', 'develop']);
  write('docs/content/a.md', 'a v1\n');
  write('docs/content/b.md', 'b v1\n');
  write('docs/content/gone.md', 'gone\n');
  run(['add', '-A']);
  run(['commit', '-q', '-m', 'base']);
  run(['branch', 'prod']);

  write('docs/content/a.md', 'a v2 (develop)\n');
  run(['commit', '-q', '-am', 'clean pick (#1)']);
  const clean = run(['rev-parse', 'HEAD']);

  write('docs/content/b.md', 'b v2 (develop)\n');
  run(['commit', '-q', '-am', 'conflicting pick (#2)']);
  const conflicting = run(['rev-parse', 'HEAD']);

  write('docs/content/gone.md', 'gone, edited on develop\n');
  run(['commit', '-q', '-am', 'edits a page prod deleted (#3)']);
  const modifyDelete = run(['rev-parse', 'HEAD']);

  write('docs/content/c.md', 'c\n');
  run(['add', '-A']);
  run(['commit', '-q', '-m', 'already on prod (#4)']);
  const duplicate = run(['rev-parse', 'HEAD']);

  run(['switch', '-q', 'prod']);
  write('docs/content/b.md', 'b v2 (prod)\n');
  run(['commit', '-q', '-am', 'prod edits b']);
  run(['rm', '-q', 'docs/content/gone.md']);
  run(['commit', '-q', '-m', 'prod deletes gone']);
  run(['cherry-pick', duplicate]);
  run(['switch', '-q', 'develop']);

  return { root, run, clean, conflicting, modifyDelete, duplicate };
}

test('resetSyncBranch creates the branch at the target and applyCommits sorts each pick', () => {
  const f = fixture();

  try {
    resetSyncBranch(f.root, 'docs-sync/prod', 'prod');
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), git(f.root, ['rev-parse', 'prod']));

    const result = applyCommits(f.root, [f.clean, f.conflicting, f.modifyDelete, f.duplicate]);

    assert.deepEqual(result.applied, [f.clean]);
    assert.deepEqual(result.empty, [f.duplicate]);
    assert.deepEqual(result.conflicts.map((c) => c.sha), [f.conflicting, f.modifyDelete]);
    assert.deepEqual(result.conflicts[0].files, ['docs/content/b.md']);
    assert.deepEqual(result.conflicts[1].files, ['docs/content/gone.md']);

    // The tree is clean after every outcome, so the next pick starts fresh.
    assert.equal(git(f.root, ['status', '--porcelain']), '');
    // Author is kept, committer is the bot, and -x recorded the source.
    assert.equal(git(f.root, ['log', '-1', '--format=%an %ce']), `Author ${SYNC_COMMITTER.email}`);
    assert.match(git(f.root, ['log', '-1', '--format=%B']), new RegExp(`cherry picked from commit ${f.clean}`));
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('applyCommits rethrows on a non-conflict, non-empty cherry-pick failure and leaves a clean tree', () => {
  const f = fixture();

  try {
    resetSyncBranch(f.root, 'docs-sync/prod', 'prod');

    // Force cherry-pick to fail for a reason that is neither a content
    // conflict nor an empty pick, without depending on commit hooks (which
    // `git cherry-pick` does not run): point GPG at a binary that can't
    // execute, the same class of infra failure the reviewer named.
    f.run(['config', 'commit.gpgsign', 'true']);
    f.run(['config', 'gpg.program', '/nonexistent-gpg-binary-xyz']);

    assert.throws(
      () => applyCommits(f.root, [f.clean]),
      /Cherry-pick of .+ failed for a reason other than a conflict or an empty pick/,
    );
    // Recovery still has to happen even though the error propagates.
    assert.equal(git(f.root, ['status', '--porcelain']), '');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('recoverFromFailedPick cleans a stuck cherry-pick and leaves HEAD unchanged', () => {
  const f = fixture();

  try {
    resetSyncBranch(f.root, 'docs-sync/prod', 'prod');
    const headBefore = git(f.root, ['rev-parse', 'HEAD']);

    // Put the checkout into a real conflicted cherry-pick, bypassing applyCommits.
    assert.throws(() => f.run(['cherry-pick', '-x', f.conflicting]));
    assert.notEqual(git(f.root, ['status', '--porcelain']), '');

    recoverFromFailedPick(f.root, f.conflicting);

    assert.equal(git(f.root, ['status', '--porcelain']), '');
    assert.equal(git(f.root, ['rev-parse', 'HEAD']), headBefore);

    // The sequencer state is actually cleared, not just the porcelain status:
    // a fresh cherry-pick can start without "previous cherry-pick not concluded".
    assert.throws(() => f.run(['cherry-pick', '-x', f.conflicting]));
    assert.equal(git(f.root, ['status', '--porcelain']), 'UU docs/content/b.md');
    f.run(['cherry-pick', '--abort']);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('hasForeignCommits is false for bot picks and true once a human commits', () => {
  const f = fixture();

  try {
    resetSyncBranch(f.root, 'docs-sync/prod', 'prod');
    applyCommits(f.root, [f.clean]);
    assert.equal(hasForeignCommits(f.root, 'prod', 'docs-sync/prod'), false);

    // A second genuine bot pick must not corrupt the first entry's parsing:
    // git appends its own newline after every `%x1e` record separator, and a
    // separator placed after the body would drag that newline onto the front
    // of the next entry's email. Author identity is set explicitly (not left
    // to ambient global git config, which a CI runner has none of).
    execFileSync('git', ['commit', '--allow-empty', '-m', `second bot pick\n\n(cherry picked from commit ${f.clean})`], {
      cwd: f.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_DIR: undefined,
        GIT_AUTHOR_NAME: 'Author',
        GIT_AUTHOR_EMAIL: 'author@example.com',
        GIT_COMMITTER_NAME: SYNC_COMMITTER.name,
        GIT_COMMITTER_EMAIL: SYNC_COMMITTER.email,
      },
    });
    assert.equal(hasForeignCommits(f.root, 'prod', 'docs-sync/prod'), false);

    f.run(['commit', '-q', '--allow-empty', '-m', 'human resolves something']);
    assert.equal(hasForeignCommits(f.root, 'prod', 'docs-sync/prod'), true);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('hasForeignCommits is true for a spoofed committer email without a cherry-pick trailer', () => {
  const f = fixture();

  try {
    resetSyncBranch(f.root, 'docs-sync/prod', 'prod');

    // A committer email alone is an unauthenticated local git-config value:
    // anyone with push access can set it to the bot's address. Without the
    // `-x` trailer the bot always writes, this must still count as foreign.
    execFileSync('git', ['commit', '--allow-empty', '-m', 'manual commit pretending to be the bot'], {
      cwd: f.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_DIR: undefined,
        GIT_AUTHOR_NAME: 'Attacker',
        GIT_AUTHOR_EMAIL: 'attacker@example.com',
        GIT_COMMITTER_NAME: 'docs-sync[bot]',
        GIT_COMMITTER_EMAIL: SYNC_COMMITTER.email,
      },
    });

    assert.equal(hasForeignCommits(f.root, 'prod', 'docs-sync/prod'), true);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});
