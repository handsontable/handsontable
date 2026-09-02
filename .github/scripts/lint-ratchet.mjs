#!/usr/bin/env node
/**
 * Determinism ratchet (CLI).
 *
 * Runs the pure intersection (lib/lint-ratchet.mjs) over THIS branch's diff: a
 * warn-level `sleep()` / `it.flaky()` / `.skip` (`RATCHETED_RULES`) on a line
 * the branch ADDED is a failure; a pre-existing one stays a warning. Blocking
 * in both places it runs — pre-push (`scripts/pre-push.mjs`) and CI
 * (`lint.yml`) — with the same script and the same rule set, so the local
 * scope is exactly the CI scope.
 *
 * Fast by construction: no build, ESLint runs on the changed spec/unit files
 * only, and the script exits 0 before spawning anything when none changed or
 * when the diff added no line to them.
 *
 * Never a false block. Every tooling gap — no base ref to diff against, ESLint
 * missing or exiting 2 (config/parse gap), unparsable output, an unexpected
 * throw — prints a notice and exits 0; CI's full lint stays authoritative.
 * Exit 1 means exactly one thing: the finding list is non-empty.
 *
 * Usage:  node .github/scripts/lint-ratchet.mjs [--base <ref>]
 * Env:    GATE_BASE   Base ref/SHA (CI passes github.event.pull_request.base.sha).
 *         `--base` wins over GATE_BASE; with neither, the merge-base with
 *         origin/develop (then develop) is used.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { repoRoot } from './lib/repo-root.mjs';
import {
  formatReport,
  parseAddedLines,
  selectRatchetedFiles,
  selectRatchetedFindings,
} from './lib/lint-ratchet.mjs';

/**
 * Cap for ESLint's JSON output. Dozens of specs with hundreds of legacy
 * warnings exceed Node's 1 MB default, and an overflow kills the child with
 * no verdict.
 *
 * @type {number}
 */
const ESLINT_MAX_BUFFER = 64 * 1024 * 1024;

// Anchor every path and spawn to the repo root, resolved from this script's
// location — a git-derived root is wrong under the `GIT_DIR` every hook exports.
const root = repoRoot();
const packageDir = path.join(root, 'handsontable');

// Children run with an explicit cwd; an inherited `GIT_DIR`/`GIT_WORK_TREE`
// would make git read that cwd as the work tree.
const env = { ...process.env };

delete env.GIT_DIR;
delete env.GIT_WORK_TREE;

/**
 * Run git in the repo root, returning stdout (empty string on any failure).
 *
 * @param {string[]} args Git arguments.
 * @returns {string} Trimmed stdout, or ''.
 */
function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: ESLINT_MAX_BUFFER,
    }).trim();
  } catch {
    // The caller treats '' as "no answer" and decides whether that is a skip.
    return '';
  }
}

/**
 * End the run without a verdict. The gate may not block on its own tooling.
 *
 * @param {string} reason What could not be done.
 * @returns {never} Exits 0.
 */
function skip(reason) {
  console.log(`Determinism ratchet: ${reason} — skipped; CI's lint is authoritative.`);
  process.exit(0);
}

/**
 * Resolve the commit to diff against: the merge-base of the requested ref (or
 * the trunk) with HEAD, so only this branch's own changes are read. Falls back
 * to the requested commit itself when no merge-base exists (a shallow CI
 * clone), and to null when nothing usable was found.
 *
 * @param {string} requested A ref/SHA from `--base` or `GATE_BASE`, or ''.
 * @returns {string|null} A commit SHA, or null.
 */
function resolveBase(requested) {
  if (requested) {
    const mergeBase = git(['merge-base', requested, 'HEAD']);

    if (mergeBase) {
      return mergeBase;
    }

    return git(['rev-parse', '--verify', '--quiet', `${requested}^{commit}`]) || null;
  }

  for (const ref of ['origin/develop', 'develop']) {
    const mergeBase = git(['merge-base', ref, 'HEAD']);

    if (mergeBase) {
      return mergeBase;
    }
  }

  return null;
}

try {
  const { values } = parseArgs({ options: { base: { type: 'string' } }, strict: false });
  const base = resolveBase(values.base || process.env.GATE_BASE || '');

  if (!base) {
    skip('no base ref to diff against (pass --base <ref> or set GATE_BASE)');
  }

  // Deleted files carry no added line and would make ESLint fail on a missing
  // path; a rename is reported under its new name.
  const changed = git(['diff', '--name-only', '-z', '--diff-filter=d', '-M', base, 'HEAD'])
    .split('\0').filter(Boolean);
  const candidates = selectRatchetedFiles(changed).filter(file => existsSync(path.join(root, file)));

  if (candidates.length === 0) {
    console.log('Determinism ratchet: no changed spec/unit file under handsontable/ — nothing to ratchet.');
    process.exit(0);
  }

  // `-U0`: added lines only, no context to walk. The prefixes are pinned so a
  // user's `diff.noprefix` / `diff.mnemonicPrefix` cannot change the header
  // shape the parser expects; `-M` keeps a renamed spec's untouched lines from
  // reading as added.
  const diff = git([
    'diff', '-U0', '--no-color', '--no-ext-diff', '-M', '--src-prefix=a/', '--dst-prefix=b/',
    base, 'HEAD', '--', ...candidates,
  ]);
  const addedLines = parseAddedLines(diff);
  const addedTotal = [...addedLines.values()].reduce((sum, lines) => sum + lines.size, 0);

  if (addedTotal === 0) {
    console.log('Determinism ratchet: the changed spec/unit files gained no line — nothing to ratchet.');
    process.exit(0);
  }

  // The package's own ESLint, by path, so the `handsontable` plugin and the
  // package `.eslintignore` resolve exactly as in the CI lint task. Not `npx`:
  // in an unbootstrapped worktree npx would fetch an unrelated eslint from the
  // registry instead of failing fast.
  const eslintBin = path.join(packageDir, 'node_modules', 'eslint', 'bin', 'eslint.js');

  if (!existsSync(eslintBin)) {
    skip('handsontable/node_modules is not installed (run pnpm install)');
  }

  const lint = spawnSync(process.execPath, [
    eslintBin, '--format', 'json', ...candidates.map(file => path.relative(packageDir, path.join(root, file))),
  ], { cwd: packageDir, env, encoding: 'utf8', maxBuffer: ESLINT_MAX_BUFFER });

  if (lint.error || lint.signal || lint.status === null) {
    skip(`ESLint did not complete (${lint.error?.code || lint.signal})`);
  }

  // 0 = clean, 1 = lint findings (the JSON is complete either way), 2 = a
  // config or crash — no verdict to read.
  if (lint.status === 2) {
    skip(`ESLint exited 2 (config or parse gap): ${(lint.stderr || '').trim().split('\n')[0]}`);
  }

  let results;

  try {
    results = JSON.parse(lint.stdout);
  } catch {
    skip('ESLint printed no parsable JSON');
  }

  const findings = selectRatchetedFindings(results, addedLines, { root });

  console.log(formatReport(findings));

  if (findings.length > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  // An unexpected throw is a bug in this script, not in the author's change.
  skip(`unexpected error (${error?.message || error})`);
}
