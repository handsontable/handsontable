#!/usr/bin/env node
/**
 * Pre-commit hook (invoked by lefthook). Fast, staged-only feedback: ESLint
 * `--fix` the staged source/spec files that have a config, re-stage what it
 * fixed, and block the commit only on genuine lint errors (e.g. a focused test,
 * a `throw new Error`). The comprehensive checks are the pre-push gate's job.
 */
import { execSync, spawnSync } from 'node:child_process';
import { lintable, runEslint } from './lint-files.mjs';

const staged = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
  .split('\n').filter(Boolean);
const targets = lintable(staged);

if (targets.length === 0) {
  process.exit(0);
}

if (runEslint(targets, { fix: true }) === 1) {
  process.exit(1);
}

// Re-stage anything `--fix` rewrote, so the commit includes the fixes.
spawnSync('git', ['add', ...targets], { stdio: 'ignore' });
process.exit(0);
