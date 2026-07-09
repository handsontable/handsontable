/**
 * Shared helpers for the Claude Code agent hooks (post-tool-use + stop).
 */
import { tmpdir } from 'node:os';
import path from 'node:path';

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
