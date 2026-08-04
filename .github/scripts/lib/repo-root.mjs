/**
 * Repository layout helpers for the gates and hooks — pure, no subprocess.
 *
 * Both functions exist because git's own answers are unreliable in the one
 * environment the hooks always run in: a git hook exports `GIT_DIR` (and, in a
 * worktree, points it at `<main>/.git/worktrees/<name>`). With `GIT_DIR` set
 * explicitly, `git rev-parse --show-toplevel` stops discovering the work tree by
 * walking up from the cwd and reports the cwd itself, so a git-derived root is
 * whatever directory the caller happened to start from.
 */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This module lives at <root>/.github/scripts/lib/, so the root is three levels
// up. Anchored HERE, not at the call sites: every caller then gets the root with
// no arguments and no chance of an off-by-one level.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Absolute path to the repository root, derived from this file's own location.
 * Independent of the cwd and of the git environment variables, so it is correct
 * in a git hook, in CI, and in a linked worktree alike.
 *
 * @returns {string} The repository root path.
 */
export function repoRoot() {
  return ROOT;
}

/**
 * Absolute path to the git directory of the checkout at `root` — the place for
 * per-checkout, never-committed state. In a normal clone that is `<root>/.git`.
 * In a linked worktree `<root>/.git` is a FILE holding `gitdir: <path>`, and the
 * real directory is `<main>/.git/worktrees/<name>`; writing to the file's path
 * fails with ENOTDIR.
 *
 * Resolves the worktree's own git directory, not the shared common directory, so
 * per-checkout state stays per-checkout.
 *
 * @param {string} root The repository root (from `repoRoot()`).
 * @returns {string|null} The git directory, or null when `root` is not a checkout.
 */
export function gitDir(root) {
  const dotGit = path.join(root, '.git');

  try {
    if (statSync(dotGit).isDirectory()) {
      return dotGit;
    }
    const match = readFileSync(dotGit, 'utf8').match(/^gitdir:\s*(.+)$/m);

    // The pointer is usually absolute; resolve() keeps a relative one working.
    return match ? path.resolve(root, match[1].trim()) : null;
  } catch {
    return null;
  }
}
