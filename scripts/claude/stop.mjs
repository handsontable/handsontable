#!/usr/bin/env node
/**
 * Claude Code Stop hook. When the agent ends a turn, verify the tests it
 * touched this session. Blocks (exit 2, which returns control to the agent with
 * the message) only on unambiguous problems:
 *   - a NEW Jasmine spec was created (new E2E must be Playwright), or
 *   - a Playwright spec the session touched now fails.
 *
 * It does NOT hard-block on "source changed without a test" — that fires every
 * turn and would be hostile mid-task; pre-push and CI enforce existence, where
 * the `Refactor-only:` escape is available.
 */
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { isNewJasmineSpec } from '../../.github/scripts/lib/presence-gate.mjs';
import { repoRoot, sessionEditsFile, stopVerdict, toRepoRelative } from './session.mjs';
import { changedPlaywrightSpecs, changedUnitTests, unitTestPattern, isJestInfraFailure } from '../pre-push.mjs';
import { filterCached, recordGreen } from '../e2e-run-cache.mjs';

/**
 * Read all of stdin synchronously.
 *
 * @returns {string} Raw stdin contents (empty string if none).
 */
function readStdin() {
  try {
    return spawnSync('cat', { stdio: ['inherit', 'pipe', 'ignore'], encoding: 'utf8' }).stdout || '';
  } catch {
    return '';
  }
}

let payload = {};

try {
  payload = JSON.parse(readStdin());
} catch { /* ignore */ }
const editsFile = sessionEditsFile(payload?.session_id || 'default');

if (!existsSync(editsFile)) {
  process.exit(0);
}

// Normalize to repo-relative and drop anything outside the repo (older sessions
// recorded absolute paths, and scratchpad edits land outside the tree). This
// keeps `git status` and the repo-relative classifiers from choking.
const root = repoRoot();
const paths = [...new Set(
  readFileSync(editsFile, 'utf8').split('\n')
    .map(p => toRepoRelative(p.trim(), root))
    .filter(Boolean),
)];

if (paths.length === 0) {
  process.exit(0);
}

/**
 * Run a git command from the repo root, returning trimmed stdout (null on error —
 * a stray path must never crash the turn).
 *
 * @param {string} cmd The git command.
 * @returns {string|null} stdout, or null on failure.
 */
function git(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/**
 * Status letter for a path (A for added/untracked, M for modified). Checks the
 * working tree first; when the tree is clean (the agent already COMMITTED the
 * file this turn), falls back to the diff against the trunk merge-base — so a
 * new Jasmine spec cannot dodge the freeze by being committed before Stop fires.
 *
 * @param {string} p Repo-relative path.
 * @returns {string|null} A single status letter, or null on error.
 */
function statusOf(p) {
  const out = git(`git status --porcelain -- "${p}"`);

  if (out === null) {
    return null;
  }

  if (out) {
    const code = out.slice(0, 2);

    return code.includes('?') ? 'A' : (code.trim()[0] || 'M');
  }

  // Clean tree — classify against the merge-base with the trunk instead.
  const mergeBase = git('git merge-base origin/develop HEAD') || git('git merge-base develop HEAD');
  const diff = mergeBase ? git(`git diff --name-status ${mergeBase} HEAD -- "${p}"`) : null;

  return diff ? (diff.trim()[0] || 'M') : 'M';
}

const entries = paths.map(p => ({ status: statusOf(p), path: p })).filter(e => e.status);
const verdict = stopVerdict(entries, isNewJasmineSpec);

if (verdict.block && verdict.reason === 'new-jasmine-spec') {
  process.stderr.write(
    'A new Jasmine *.spec.js was created this turn. The Jasmine suite is frozen — '
    + `move it to tests/e2e/ as a Playwright *.spec.ts before finishing:\n  ${
      verdict.newJasmine.join('\n  ')}\n`);
  process.exit(2);
}

// Run any Playwright spec the session touched; a red test the agent wrote must
// not survive the turn. Paths anchor to the repo root — the hook's cwd is not
// guaranteed to be it.
const touched = changedPlaywrightSpecs(paths).filter(s => existsSync(path.join(root, 'tests', s)));
// Green-run cache: skip specs already proven against this exact spec content +
// environment (dedupes repeat turns and the later pre-push re-run).
const { toRun } = filterCached(root, touched);

if (toRun.length > 0) {
  // Local smoke = the default theme only (fast agent loop); CI runs the full
  // theme matrix (main/horizon/classic). See the run-scope note in the
  // handsontable-playwright-e2e skill.
  const pw = spawnSync('npx', ['playwright', 'test', '--project=e2e-main', ...toRun], {
    cwd: path.join(root, 'tests'), stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8',
  });

  if (pw.status !== 0) {
    process.stderr.write(
      `Playwright specs you touched are failing — fix them before finishing:\n${pw.stdout || ''}${pw.stderr || ''}`,
    );
    process.exit(2);
  }
  recordGreen(root, toRun);
}

// Run any changed Jest unit test the session touched — fast (jest maps to src,
// no build). One jest per existing file (a single, shell-safe --testPathPattern;
// never a `|`-joined regex, which run.mjs would append to a shell unquoted). An
// infra failure (jest could not start) does not block the turn.
const unitFiles = changedUnitTests(paths).filter(f => existsSync(path.join(root, f)));

for (const file of unitFiles) {
  const jest = spawnSync(
    'npm',
    ['run', 'test:unit', '--', `--testPathPattern=${unitTestPattern(file)}`],
    { cwd: path.join(root, 'handsontable'), encoding: 'utf8' },
  );

  if (jest.status !== 0) {
    if (isJestInfraFailure(`${jest.stdout || ''}${jest.stderr || ''}`)) {
      break;
    }
    process.stderr.write(
      `Unit tests you touched are failing — fix them before finishing:\n${jest.stdout || ''}${jest.stderr || ''}`,
    );
    process.exit(2);
  }
}

process.exit(0);
