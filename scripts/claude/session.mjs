/**
 * Shared helpers for the Claude Code agent hooks (post-tool-use + stop).
 */
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Absolute path to the repository root, or the current working directory if git
 * cannot resolve it.
 *
 * @returns {string} The repository root path.
 */
export function repoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || process.cwd();
  } catch {
    return process.cwd();
  }
}

/**
 * Normalize a path (absolute, or relative to the repo root) to a repo-relative
 * path. Returns null when the path is outside the repository — the agent edits
 * files elsewhere (e.g. a scratchpad), and those must never reach `git status`
 * or the repo-relative presence-gate classifiers.
 *
 * @param {string} p A path from a tool payload or the session edits file.
 * @param {string} root The repository root (from `repoRoot()`).
 * @returns {string|null} The repo-relative path, or null if outside the repo.
 */
export function toRepoRelative(p, root) {
  if (!p) {
    return null;
  }
  const rel = path.relative(root, path.resolve(root, p));

  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }

  return rel;
}

/**
 * Path to the per-session file that records which paths the agent edited this
 * turn/session. The PostToolUse hook appends to it; the Stop hook reads it.
 *
 * @param {string} sessionId The Claude Code session id (or 'default').
 * @returns {string} An absolute temp file path.
 */
export function sessionEditsFile(sessionId) {
  const safe = String(sessionId).replace(/[^A-Za-z0-9_-]/g, '_');

  return path.join(tmpdir(), 'hot-claude-hooks', `${safe}.edits`);
}

/**
 * Decide what the Stop hook should do, given the session's changed files.
 * Pure, so it is unit-testable.
 *
 * Philosophy: a Stop hook fires on every turn end, so it blocks only on
 * unambiguous violations — a NEW Jasmine spec (new E2E must be Playwright).
 * The "a test must exist for this source" check is left to pre-push and CI,
 * where the `Refactor-only:` escape exists. Whether touched tests pass is
 * decided by the CLI actually running them.
 *
 * @param {{status: string, path: string}[]} entries Session changes.
 * @param {(c: {status: string, path: string}) => boolean} isNewJasmineSpec Predicate.
 * @returns {{ block: boolean, reason: string, newJasmine: string[] }} Verdict.
 */
export function stopVerdict(entries, isNewJasmineSpec) {
  const newJasmine = entries.filter(isNewJasmineSpec).map(e => e.path);

  if (newJasmine.length > 0) {
    return { block: true, reason: 'new-jasmine-spec', newJasmine };
  }

  return { block: false, reason: 'ok', newJasmine };
}
