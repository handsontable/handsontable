/**
 * The git side of the docs sync: rebuild the bot-owned branch from the target
 * and cherry-pick the included commits one by one.
 *
 * Every pick is `-x` so the squash body of the merged pull request carries the
 * source sha, which is one of the dedup signals `candidates.mjs` reads. The
 * committer identity is fixed so `hasForeignCommits` can tell a bot pick from a
 * human commit: cherry-pick keeps the original author, so the author field
 * cannot make that distinction.
 */
import { execFileSync } from 'node:child_process';

export const SYNC_COMMITTER = {
  name: 'docs-sync[bot]',
  email: 'docs-sync[bot]@users.noreply.github.com',
};

/**
 * Run git in a checkout with the bot's committer identity.
 *
 * @param {string} cwd Checkout root.
 * @param {string[]} args Arguments after `git`.
 * @returns {string} Trimmed stdout.
 */
export function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      GIT_DIR: undefined,
      GIT_COMMITTER_NAME: SYNC_COMMITTER.name,
      GIT_COMMITTER_EMAIL: SYNC_COMMITTER.email,
    },
  }).trim();
}

/**
 * Whether the sync branch carries any commit the bot did not make.
 *
 * @param {string} cwd
 * @param {string} targetRef e.g. `origin/prod-docs/18.1`.
 * @param {string} syncRef e.g. `origin/docs-sync/prod-docs-18.1`.
 * @returns {boolean}
 */
export function hasForeignCommits(cwd, targetRef, syncRef) {
  const emails = git(cwd, ['log', '--format=%ce', `${targetRef}..${syncRef}`]).split('\n').filter(Boolean);

  return emails.some((email) => email !== SYNC_COMMITTER.email);
}

/**
 * Point the sync branch at the target tip and check it out.
 *
 * @param {string} cwd
 * @param {string} branch The local sync branch name.
 * @param {string} targetRef The ref to start from.
 */
export function resetSyncBranch(cwd, branch, targetRef) {
  git(cwd, ['checkout', '-q', '-B', branch, targetRef]);
}

/**
 * Paths in conflict after a failed cherry-pick, including modify/delete.
 *
 * @param {string} cwd
 * @returns {string[]}
 */
function conflictedFiles(cwd) {
  return git(cwd, ['status', '--porcelain'])
    .split('\n')
    .filter((line) => /^(UU|AA|DU|UD|AU|UA|DD) /.test(line))
    .map((line) => line.slice(3).trim())
    .sort();
}

/**
 * Cherry-pick each sha in order. A conflict is aborted and recorded; an empty
 * pick (the change is already in the tree) is skipped and recorded.
 *
 * @param {string} cwd
 * @param {string[]} shas Oldest first.
 * @returns {{ applied: string[], conflicts: Array<{ sha: string, files: string[] }>, empty: string[] }}
 */
export function applyCommits(cwd, shas) {
  const applied = [];
  const conflicts = [];
  const empty = [];

  for (const sha of shas) {
    try {
      git(cwd, ['cherry-pick', '-x', sha]);
      applied.push(sha);
    } catch (error) {
      const message = `${error.stderr ?? ''}${error.stdout ?? ''}`;
      const files = conflictedFiles(cwd);

      if (files.length === 0 && /empty|nothing to commit/i.test(message)) {
        git(cwd, ['cherry-pick', '--skip']);
        empty.push(sha);
      } else {
        git(cwd, ['cherry-pick', '--abort']);
        conflicts.push({ sha, files });
      }
    }
  }

  return { applied, conflicts, empty };
}
