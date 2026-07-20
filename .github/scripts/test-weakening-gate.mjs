#!/usr/bin/env node
/**
 * Test-weakening gate (CLI). Surfaces specs that were *weakened* in this change —
 * assertions removed, or a skip/focus added — which is the classic "make it green"
 * move. Covers modified, ADDED, and renamed specs: a brand-new spec born with
 * `.skip`/`.only` satisfies the presence gate while running nothing, so added
 * files are diffed against empty (and renames against their old path, so
 * pre-existing skips don't read as new). Non-blocking (warn): it prints a
 * Markdown verdict and always exits 0. It escalates a finding to "flag" when the
 * same change also touches real source (using the presence gate's classifier,
 * which excludes spec/test files).
 *
 * Base ref: GATE_BASE env, else the merge-base with origin/develop, else develop.
 * Skips cleanly (exit 0, no output) when there is nothing to compare.
 */
import { execSync } from 'node:child_process';
import { detectWeakening, parseNameStatus } from './lib/test-weakening.mjs';
import { isSource } from './lib/presence-gate.mjs';

const SPEC_RE = /\.(spec|unit)\.[jt]sx?$/;

/**
 * Run a git command, returning stdout (empty string on failure).
 *
 * @param {string} cmd The git command.
 * @returns {string} stdout, trimmed.
 */
function git(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const baseRef = process.env.GATE_BASE
  || git('git merge-base origin/develop HEAD')
  || 'develop';
// Anchor at the merge-base so only THIS branch's changes are diffed — with the
// base-branch tip directly, a PR that is behind base would show base-side edits
// as if the PR made them (and diffing to the worktree instead of HEAD would
// include uncommitted noise). Idempotent when GATE_BASE is already a merge-base.
const base = git(`git merge-base ${baseRef} HEAD`) || baseRef;

const nameStatus = git(`git diff --name-status ${base} HEAD`);

if (!nameStatus) {
  process.exit(0);
}

const rows = parseNameStatus(nameStatus);

// Real source only — the presence-gate classifier excludes spec/unit/test files,
// so a spec-only change never counts as "source changed".
const sourceChanged = rows.some(r => isSource({ path: r.path }));
// Modified, ADDED, and renamed specs. Added specs diff against empty (a new spec
// carrying .skip/.only is weakening — it satisfies presence while running
// nothing); renamed specs diff against their OLD path so pre-existing markers
// don't read as newly added.
const changedSpecs = rows.filter(r => 'MAR'.includes(r.status) && SPEC_RE.test(r.path));

const flagged = [];

for (const { status, oldPath, path } of changedSpecs) {
  const before = status === 'A' ? '' : git(`git show ${base}:${oldPath}`);
  const after = git(`git show HEAD:${path}`) || '';
  const { findings, severity } = detectWeakening(before, after, { sourceChanged });

  if (findings.length > 0) {
    flagged.push({ path, findings, severity });
  }
}

if (flagged.length === 0) {
  console.log('Test-weakening gate: no weakened specs detected.');
  process.exit(0);
}

const lines = ['### Test-weakening gate', '',
  'These specs were **weakened** in this change. If the reduction is legitimate (a real',
  'refactor), say so in review; otherwise it reads as "make it green" — reconcile by',
  'fixing the code or the test, not by removing what it checks.', ''];

for (const { path, findings, severity } of flagged) {
  const marker = severity === 'flag' ? '🚩' : '⚠️';

  lines.push(`- ${marker} \`${path}\`${severity === 'flag' ? ' (source also changed)' : ''}`);
  for (const f of findings) {
    if (f.type === 'assertions-removed') {
      lines.push(`    - assertions ${f.before} → ${f.after}`);
    } else {
      lines.push(`    - skip/focus markers ${f.before} → ${f.after}`);
    }
  }
}

console.log(lines.join('\n'));
process.exit(0);
