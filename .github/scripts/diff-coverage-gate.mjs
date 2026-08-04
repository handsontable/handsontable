#!/usr/bin/env node
/**
 * Coverage-floor gate CLI (DEV-2055 / 86caqbt9u). Computes changed-line
 * coverage from a unit-test lcov report and the PR diff, and reports the
 * percentage of added executable lines that tests exercise.
 *
 * Env:
 *   GATE_BASE      base ref/SHA for the diff (default: merge-base with develop)
 *   GATE_MODE      'warn' (report, always exit 0) | 'block' (exit 1 below floor)
 *   COVERAGE_FLOOR minimum percent of added instrumented lines (default 80)
 *   LCOV_PATH      lcov file (default handsontable/coverage/lcov.info)
 *
 * Report-only by design at rollout (GATE_MODE=warn): a unit-coverage floor
 * legitimately shows 0% for changes that are correctly E2E-tested rather than
 * unit-tested, so it must earn "blocking" after the team calibrates it — never
 * false-fail a properly-tested view-layer change on day one.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLcov, addedLinesByFile, computeDiffCoverage, evaluate } from './lib/diff-coverage.mjs';
import { repoRoot } from './lib/repo-root.mjs';

/**
 * Resolve the base ref to diff against — an explicit GATE_BASE, else the
 * merge-base with the trunk.
 *
 * @param {string} cwd Directory inside the repo to run git from.
 * @returns {string} A ref/SHA usable in `git diff <base>...HEAD`.
 */
function resolveBase(cwd) {
  if (process.env.GATE_BASE) {
    return process.env.GATE_BASE;
  }

  for (const ref of ['origin/develop', 'develop']) {
    try {
      return execSync(`git merge-base ${ref} HEAD`, { encoding: 'utf8', cwd }).trim();
    } catch { /* try next */ }
  }

  return 'HEAD~1';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Location-derived, not git-derived: correct from any cwd, and under the
  // `GIT_DIR` a git hook exports (see `lib/repo-root.mjs`).
  const root = repoRoot();
  const mode = process.env.GATE_MODE === 'block' ? 'block' : 'warn';
  const floor = Number(process.env.COVERAGE_FLOOR ?? 80);
  const lcovPath = path.join(root, process.env.LCOV_PATH || 'handsontable/coverage/lcov.info');
  const base = resolveBase(root);

  const summarize = (text) => {
    console.log(text);

    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
    }
  };

  if (!existsSync(lcovPath)) {
    summarize(`Coverage floor: no lcov at ${path.relative(root, lcovPath)} — skipped (unit coverage not produced).`);
    process.exit(0);
  }

  const diff = execSync(`git diff ${base}...HEAD`, { encoding: 'utf8', cwd: root, maxBuffer: 64 * 1024 * 1024 });
  const summary = computeDiffCoverage(parseLcov(readFileSync(lcovPath, 'utf8')), addedLinesByFile(diff));
  const verdict = evaluate(summary, floor);

  if (verdict.pct === null) {
    summarize('Coverage floor: no instrumented added lines to measure — nothing to enforce.');
    process.exit(0);
  }

  const worst = summary.byFile
    .filter(f => f.uncovered.length > 0)
    .sort((a, b) => b.uncovered.length - a.uncovered.length)
    .slice(0, 10)
    .map(f => `  - ${f.file}: ${f.covered}/${f.instrumented} added lines covered (uncovered: ${f.uncovered.slice(0, 12).join(', ')}${f.uncovered.length > 12 ? '…' : ''})`);

  summarize(
    `## Coverage floor (${mode})\n`
    + `Added lines covered: **${verdict.pct.toFixed(1)}%** of ${summary.instrumentedAdded} instrumented added line(s) — floor ${floor}%.\n`
    + (worst.length ? `\nLowest-covered changed files:\n${worst.join('\n')}\n` : ''),
  );

  if (!verdict.pass && mode === 'block') {
    console.error(`Coverage floor not met: ${verdict.pct.toFixed(1)}% < ${floor}%.`);
    process.exit(1);
  }

  if (!verdict.pass) {
    console.log(`(warn) below the ${floor}% floor — not blocking yet.`);
  }

  process.exit(0);
}
