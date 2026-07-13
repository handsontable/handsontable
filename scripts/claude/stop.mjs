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
import { isNewJasmineSpec } from '../../.github/scripts/lib/presence-gate.mjs';
import { repoRoot, sessionEditsFile, stopVerdict, toRepoRelative } from './session.mjs';
import { changedPlaywrightSpecs } from '../pre-push.mjs';

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
 * Git status letter for a path in the working tree (A for untracked/added,
 * M for modified). Returns null if git cannot resolve the path — a stray path
 * must never crash the turn.
 *
 * @param {string} p Repo-relative path.
 * @returns {string|null} A single status letter, or null on error.
 */
function statusOf(p) {
  let out;

  try {
    out = execSync(`git status --porcelain -- "${p}"`, {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }

  if (!out) {
    return 'M';
  }
  const code = out.slice(0, 2);

  return code.includes('?') ? 'A' : (code.trim()[0] || 'M');
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
// not survive the turn.
const specs = changedPlaywrightSpecs(paths).filter(s => existsSync(`tests/${s}`));

if (specs.length > 0) {
  const pw = spawnSync('npx', ['playwright', 'test', '--project=e2e-chromium', ...specs], {
    cwd: 'tests', stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8',
  });

  if (pw.status !== 0) {
    process.stderr.write(
      `Playwright specs you touched are failing — fix them before finishing:\n${pw.stdout || ''}${pw.stderr || ''}`,
    );
    process.exit(2);
  }
}

process.exit(0);
