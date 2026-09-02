#!/usr/bin/env node
/**
 * Pre-push gate (invoked by lefthook). The local, fast mirror of the CI
 * enforcement: a change must carry a test, and any changed Playwright spec is
 * run so a new test is proven before it is pushed. Bypassable with
 * `git push --no-verify` — CI is the real guarantee.
 *
 * Scoped to stay fast: it runs the presence gate (no build), the determinism
 * ratchet on the changed spec files, and only the Playwright specs the push
 * touches. The full unit/E2E suites are CI's job.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { repoRoot } from '../.github/scripts/lib/repo-root.mjs';
import { selectRatchetedFiles } from '../.github/scripts/lib/lint-ratchet.mjs';
import { lintable, runEslint } from './lint-files.mjs';
import { filterCached, recordGreen } from './e2e-run-cache.mjs';

// npx/npm are .cmd shims on Windows; spawnSync needs a shell there or it ENOENTs
// (a hook that fails-closed on every push just trains people to use --no-verify).
const WIN = process.platform === 'win32';

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
 * Does the push touch a file the determinism ratchet applies to? The ratchet
 * CLI makes the same decision itself and exits 0 at once; deciding here too
 * saves the spawn on the common source-only push. Pure so it can be unit-tested.
 *
 * @param {string[]} changed Repo-relative changed paths.
 * @returns {boolean} True when `.github/scripts/lint-ratchet.mjs` must run.
 */
export function needsDeterminismRatchet(changed) {
  return selectRatchetedFiles(changed).length > 0;
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

/**
 * Buffer cap for a hook-spawned test run. A suite can print far more than Node's
 * 1 MB default, and overflowing the buffer kills the child mid-run: the result
 * then carries a nonzero status and no summary, which reads exactly like failing
 * tests unless the caller inspects `result.error`.
 *
 * @type {number}
 */
export const TEST_RUN_MAX_BUFFER = 64 * 1024 * 1024;

/**
 * Longest line kept verbatim in a condensed excerpt. Longer ones are truncated
 * rather than dropped, so a long `Expected:`/`Received:` value still shows its
 * head instead of vanishing.
 *
 * @type {number}
 */
const MAX_LINE_LENGTH = 200;

/**
 * SGR (color) escape sequences, stripped before anything is matched. A test run
 * inherits the hook's environment, so a leaked `FORCE_COLOR` would wrap every
 * failure marker in escape codes and silently defeat the anchor and summary
 * patterns — the excerpt would stay bounded but stop pointing at the diagnosis.
 *
 * @type {RegExp}
 */
// eslint-disable-next-line no-control-regex -- ESC is exactly what this matches.
const ANSI_SGR = /\u001b\[[0-9;]*m/g;

/**
 * Output size past which the pre-push gate condenses a run rather than printing
 * it whole. A terminal tolerates far more than a condensed excerpt, but not the
 * tens of megabytes `TEST_RUN_MAX_BUFFER` allows a run to produce.
 *
 * @type {number}
 */
const TERMINAL_OUTPUT_LIMIT = 256 * 1024;

/**
 * Did the child process itself fail to run to completion — killed by a signal,
 * or aborted by Node (ENOBUFS on buffer overflow) — rather than finish and
 * report failing tests? Such a result carries no verdict and must not block.
 *
 * @param {{error?: Error, signal?: string|null, status?: number|null}} result A `spawnSync` result.
 * @returns {boolean} True when the process never produced a verdict.
 */
export function isSpawnInfraFailure(result) {
  return Boolean(result?.error) || Boolean(result?.signal) || result?.status === null;
}

/**
 * Condense a test run's output down to a bounded excerpt.
 * Three problems at once: stack frames and injected-stylesheet dumps are pure
 * noise, single lines repeat hundreds of times, and the result must stay inside a
 * fixed size budget no matter how much the run printed.
 *
 * Noise is identified by what a line IS, never by how long it is: an over-long
 * line is truncated, not dropped, because Jest puts each of the
 * `Expected:`/`Received:` values on a single line and those run long exactly
 * when they matter.
 *
 * Once a failure marker is found the excerpt keeps the lines that FOLLOW it, not
 * the tail of the run: the diagnosis sits at the anchor, so trimming from the end
 * would discard it exactly when the failure block is long enough to need trimming.
 * With no failure to anchor on (a crash, an infra error) the tail is the
 * informative part and is kept instead. The summary lines are pulled out and
 * always appended, so the counts survive either way.
 *
 * @param {string} output Combined stdout + stderr of the run.
 * @param {{maxLines?: number, maxChars?: number}} [options] Excerpt caps.
 * @returns {string} A bounded excerpt, prefixed with a note when truncated.
 */
export function condenseTestOutput(output, { maxLines = 120, maxChars = 8000 } = {}) {
  const isSummary = line => /^\s*(Tests|Test Suites|Snapshots):\s/.test(line);
  // Only these three are pure noise. Length alone is NOT a noise signal: Jest
  // prints the `Expected:`/`Received:` values on one line each, and dropping
  // those by length removes exactly the values needed to read the failure.
  const isNoise = line => /^\s+at\s/.test(line)
    || /Could not parse CSS stylesheet/.test(line)
    || /url\(["']?data:/.test(line);
  const raw = (output || '').replace(ANSI_SGR, '').replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  const lines = raw
    .filter(line => !isNoise(line))
    .map(line => (line.length > MAX_LINE_LENGTH ? `${line.slice(0, MAX_LINE_LENGTH)} …` : line));

  const collapsed = [];

  for (const line of lines) {
    const previous = collapsed[collapsed.length - 1];

    if (previous && previous.line === line) {
      previous.count += 1;
    } else {
      collapsed.push({ line, count: 1 });
    }
  }

  // Blank lines separate Jest's blocks, so they collapse to one but never carry a
  // repeat count — `(×4)` stamped on emptiness reads as content that is not there.
  const rendered = collapsed
    .map(({ line, count }) => (count > 1 && line.trim() !== '' ? `${line}    (×${count})` : line))
    .filter((line, index, all) => line.trim() !== '' || (all[index - 1] || '').trim() !== '');

  const summary = rendered.filter(isSummary);
  // `FAIL` is a fallback anchor, never a first-choice one. Jest prints a suite's
  // buffered console output between the `FAIL` header and the failure details, so
  // anchoring on the first marker of any kind returns the console flood and cuts
  // the block the diagnosis lives in — exactly the case this helper exists for.
  // Anchor on the earliest marker that names a failing test instead, and fall
  // back to the bare suite header only when the run printed no such marker at all
  // (a suite killed before it could report one).
  //
  // Two `●` headers are not failures and must not anchor: `● Console` opens the
  // console dump itself, and `● Validation Warning:` / `● Deprecation Warning:`
  // are config notices Jest prints before any test runs. `● Test suite failed to
  // run` IS a failure and is deliberately still matched.
  //
  // Playwright's numbered form requires its `›`, so an ordinary numbered line in
  // someone's output cannot anchor the excerpt by accident.
  const isNonFailureBullet = line => /^\s*●\s*(Console\b|(Validation|Deprecation)\s+Warning:)/.test(line);
  const namesAFailure = line => (/^\s*(●|✕|✘)/.test(line) && !isNonFailureBullet(line))
    || /^\s*\d+\)\s.*›/.test(line);
  const namedFailure = rendered.findIndex(namesAFailure);
  const firstFailure = namedFailure === -1 ? rendered.findIndex(line => /^\s*FAIL\b/.test(line)) : namedFailure;
  const anchored = (firstFailure === -1 ? rendered : rendered.slice(firstFailure)).filter(l => !isSummary(l));
  const lineBudget = Math.max(1, maxLines - summary.length);
  const kept = firstFailure === -1 ? anchored.slice(-lineBudget) : anchored.slice(0, lineBudget);
  // Count against the RAW line total, not the post-`isNoise` one: noise-filtered
  // lines are gone from `lines` before this point, so measuring from there
  // under-reports the flood by exactly the part that caused it.
  const dropped = raw.length - kept.length - summary.length;
  const charBudget = Math.max(0, maxChars - summary.join('\n').length);
  let excerpt = kept.join('\n').trimEnd();
  const cutByChars = excerpt.length > charBudget;

  if (cutByChars) {
    // Tail slices index from the front rather than passing a negative offset:
    // `slice(-0)` is `slice(0)`, which returns the whole string and silently
    // bypasses the cap when the summary alone fills the budget.
    excerpt = firstFailure === -1
      ? `…\n${excerpt.slice(excerpt.length - charBudget)}`
      : `${excerpt.slice(0, charBudget)}\n…`;
  }

  const body = [excerpt, ...summary].filter(part => part !== '').join('\n');

  // Nothing survived (blank or noise-only output) — a lone header describing an
  // empty excerpt is worse than saying nothing.
  if (body.trim() === '' || (dropped === 0 && !cutByChars)) {
    return body;
  }

  // Say when the excerpt was cut on size alone, or the header would read "0 lines
  // dropped" over an excerpt that was in fact truncated.
  const note = dropped > 0
    ? `${dropped} noise/duplicate lines dropped${cutByChars ? ', excerpt truncated' : ''}`
    : 'excerpt truncated';

  return `[output condensed — ${note}]\n${body}`;
}

// Exit early when imported by a test. pathToFileURL handles the cases a naive
// `file://${argv[1]}` template misses (Windows drive letters, URL-escaped chars).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Anchor every path/spawn to the repo root, resolved from THIS script's
  // location. A git-derived root is wrong under the `GIT_DIR` every hook exports
  // — see `.github/scripts/lib/repo-root.mjs`.
  const root = repoRoot();
  const base = resolveBase(root);

  // Hand the children a clean git environment. Each runs with an explicit cwd,
  // and an inherited `GIT_DIR`/`GIT_WORK_TREE` makes git take that cwd as the
  // work tree — so any git call from `tests/` or `handsontable/` would resolve a
  // subdirectory as the repository root.
  const env = { ...process.env };

  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;

  // 1) Presence gate (block mode).
  const gate = spawnSync('node', [path.join(root, '.github/scripts/test-presence-gate.mjs')], {
    stdio: 'inherit',
    cwd: root,
    env: { ...env, GATE_MODE: 'block', GATE_BASE: base },
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

  // 2b) Determinism ratchet — blocking. The warn-level sleep()/it.flaky()/skip
  //     rules stay warnings on the frozen suite's existing debt, but one on a
  //     line THIS push added is an error. Same script and rule set as CI
  //     (lint.yml), so the local scope is exactly the CI scope. The CLI skips
  //     (exit 0, with a notice) on every tooling gap it can meet — no base ref,
  //     ESLint missing or exiting 2 — so the only exit 1 is a real finding; a
  //     child killed before it could answer is infra and does not block either.
  if (needsDeterminismRatchet(changed)) {
    const ratchet = spawnSync('node', [path.join(root, '.github/scripts/lint-ratchet.mjs')], {
      stdio: 'inherit',
      cwd: root,
      env: { ...env, GATE_BASE: base },
    });

    if (isSpawnInfraFailure(ratchet)) {
      console.log(`pre-push: the determinism ratchet could not complete (${
        ratchet.error?.code || ratchet.signal}) — skipping; CI runs it.`);
    } else if (ratchet.status !== 0) {
      process.exit(ratchet.status);
    }
  }

  // 3) Surface weakened specs (assertions removed / skip/focus added). Non-blocking,
  //    same as CI — it is a signal for the author, not a hard gate.
  spawnSync('node', [path.join(root, '.github/scripts/test-weakening-gate.mjs')], {
    stdio: 'inherit',
    cwd: root,
    env: { ...env, GATE_BASE: base },
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
      shell: WIN,
      env,
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
        {
          cwd: path.join(root, 'handsontable'),
          encoding: 'utf8',
          shell: WIN,
          env,
          maxBuffer: TEST_RUN_MAX_BUFFER,
        },
      );

      const runOutput = `${jest.stdout || ''}${jest.stderr || ''}`;

      if (runOutput.length > TERMINAL_OUTPUT_LIMIT) {
        process.stdout.write(`${condenseTestOutput(runOutput, { maxLines: 400, maxChars: 40000 })}\n`);
        process.stdout.write(`pre-push: ${Math.round(runOutput.length / 1024)} KB of output condensed — `
          + `run \`npm run test:unit --prefix handsontable -- --testPathPattern=${unitTestPattern(file)}\` `
          + 'to see all of it.\n');
      } else {
        process.stdout.write(jest.stdout || '');
        process.stderr.write(jest.stderr || '');
      }

      if (jest.status !== 0) {
        if (isSpawnInfraFailure(jest)) {
          // Only this file lost its verdict; the remaining runs are independent.
          console.log(`pre-push: the unit run for ${file} could not complete (${
            jest.error?.code || jest.signal}) — skipping; CI runs it.`);
          continue;
        }
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
