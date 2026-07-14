#!/usr/bin/env node
/**
 * Pre-push gate (invoked by lefthook). The local, fast mirror of the CI
 * enforcement: a change must carry a test, and any changed Playwright spec is
 * run so a new test is proven before it is pushed. Bypassable with
 * `git push --no-verify` — CI is the real guarantee.
 *
 * Scoped to stay fast: it runs the presence gate (no build) and only the
 * Playwright specs the push touches. The full unit/E2E suites are CI's job.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lintable, runEslint } from './lint-files.mjs';
import { filterCached, recordGreen } from './e2e-run-cache.mjs';

/**
 * Resolve the base ref to diff against — the merge-base with the trunk.
 *
 * @param {string} cwd Directory inside the repository to run git from.
 * @returns {string} A ref/SHA usable in `git diff <base>...HEAD`.
 */
function resolveBase(cwd) {
  for (const ref of ['origin/develop', 'develop']) {
    try {
      return execSync(`git merge-base ${ref} HEAD`, { encoding: 'utf8', cwd }).trim();
    } catch {
      // try the next candidate
    }
  }

  return 'develop';
}

/**
 * Map the pushed diff to the Playwright specs that must run.
 * Pure so it can be unit-tested; returns paths relative to `tests/`.
 *
 * @param {string[]} changed Repo-relative changed paths.
 * @returns {string[]} Spec paths relative to the `tests/` package.
 */
export function changedPlaywrightSpecs(changed) {
  return changed
    .filter(f => /^tests\/e2e\/.+\.spec\.ts$/.test(f))
    .map(f => f.replace(/^tests\//, ''));
}

/**
 * Map the diff to the Jest unit test files that must run — handsontable
 * `*.unit.{js,ts}` outside build output. Pure so it can be unit-tested.
 *
 * @param {string[]} changed Repo-relative changed paths.
 * @returns {string[]} Changed unit-test paths (repo-relative).
 */
export function changedUnitTests(changed) {
  return changed.filter(f => /^handsontable\/.*\.unit\.[jt]sx?$/.test(f) && !/\/(dist|tmp)\//.test(f));
}

/**
 * A single unit file's `--testPathPattern` value — the path relative to the
 * handsontable package. Deliberately NOT a `|`-joined multi-file regex and NOT
 * regex-escaped: `run.mjs` appends the pattern to a `cross-env-shell` command
 * UNQUOTED, so a `|` is read as a shell pipe and `\` is eaten by the shell.
 * Repo test paths contain no shell metacharacters, so the bare relative path is
 * safe; run ONE jest per file (see the hook loop).
 *
 * @param {string} unitFile A repo-relative unit-test path.
 * @returns {string} The handsontable-relative path to pass to `--testPathPattern`.
 */
export function unitTestPattern(unitFile) {
  return unitFile.replace(/^handsontable\//, '');
}

/**
 * Did Jest fail to START (a config/module-resolution error) rather than report
 * a real test failure? Such infra failures must NOT block the push — CI is
 * authoritative — the same way the presence gate skips on an ESLint config gap.
 *
 * @param {string} output Combined Jest stdout + stderr.
 * @returns {boolean} True when the output looks like Jest could not run at all.
 */
export function isJestInfraFailure(output) {
  const s = output || '';
  const ran = /Tests:\s+\d|Test Suites:\s+\d/.test(s); // a real run prints a summary
  const infra = /Validation Error|was not found|Cannot find module|No tests found/i.test(s);

  return infra && !ran;
}

// Exit early when imported by a test. pathToFileURL handles the cases a naive
// `file://${argv[1]}` template misses (Windows drive letters, URL-escaped chars).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Anchor every path/spawn to the repo root — callers may start the hook from
  // any cwd, so resolve the root from THIS script's location, not the cwd.
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', cwd: scriptDir }).trim();
  const base = resolveBase(root);

  // 1) Presence gate (block mode).
  const gate = spawnSync('node', [path.join(root, '.github/scripts/test-presence-gate.mjs')], {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, GATE_MODE: 'block', GATE_BASE: base },
  });

  if (gate.status !== 0) {
    process.exit(gate.status ?? 1);
  }

  const changed = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8', cwd: root })
    .split('\n').filter(Boolean);

  // 2) ESLint the changed, config-covered files — blocks on lint errors (a focused
  //    test, determinism/anti-gaming violations, etc.). Warnings surface, don't block.
  if (runEslint(lintable(changed), { cwd: root }) === 1) {
    process.exit(1);
  }

  // 3) Surface weakened specs (assertions removed / skip/focus added). Non-blocking,
  //    same as CI — it is a signal for the author, not a hard gate.
  spawnSync('node', [path.join(root, '.github/scripts/test-weakening-gate.mjs')], {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, GATE_BASE: base },
  });

  // 4) Run any Playwright spec the push changed, so a new test is proven.
  //    The green-run cache dedupes across hooks/agents: a spec already proven
  //    green (same spec content, same dist+fixtures) — e.g. by the Claude Stop
  //    hook — is not re-proven here.
  const touched = changedPlaywrightSpecs(changed).filter(s => existsSync(path.join(root, 'tests', s)));
  const { toRun, skipped } = filterCached(root, touched);

  if (skipped.length > 0) {
    console.log(`pre-push: ${skipped.length} spec(s) already proven green (unchanged spec + environment) — skipped.`);
  }

  if (toRun.length > 0) {
    console.log(`pre-push: running ${toRun.length} changed Playwright spec(s)…`);
    // Local smoke = the default theme only (fast); CI runs the full theme
    // matrix (main/horizon/classic).
    const pw = spawnSync('npx', ['playwright', 'test', '--project=e2e-main', ...toRun], {
      cwd: path.join(root, 'tests'),
      stdio: 'inherit',
    });

    if (pw.status !== 0) {
      process.exit(pw.status ?? 1);
    }
    recordGreen(root, toRun);
  }

  // 5) Run any changed Jest unit test — fast (jest maps to src, no build). One
  //    jest per file (a single, shell-safe --testPathPattern; never a `|`-joined
  //    regex — run.mjs appends it to a shell command unquoted). Only existing
  //    files (a session may record a path that was later removed). An infra
  //    failure (jest could not start) warns instead of blocking; CI is
  //    authoritative.
  const unitFiles = changedUnitTests(changed).filter(f => existsSync(path.join(root, f)));

  if (unitFiles.length > 0) {
    console.log(`pre-push: running ${unitFiles.length} changed unit test(s)…`);

    for (const file of unitFiles) {
      const jest = spawnSync(
        'npm',
        ['run', 'test:unit', '--', `--testPathPattern=${unitTestPattern(file)}`],
        { cwd: path.join(root, 'handsontable'), encoding: 'utf8' },
      );

      process.stdout.write(jest.stdout || '');
      process.stderr.write(jest.stderr || '');

      if (jest.status !== 0) {
        if (isJestInfraFailure(`${jest.stdout || ''}${jest.stderr || ''}`)) {
          console.log('pre-push: could not run unit tests locally (jest infra) — skipping; CI runs them.');
          break;
        }
        process.exit(jest.status ?? 1);
      }
    }
  }

  console.log('pre-push: ok');
}
