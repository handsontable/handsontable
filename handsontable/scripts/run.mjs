/**
 * Unified build/test/lint dispatcher for Handsontable.
 *
 * All npm run scripts delegate to this file; task definitions live in tasks.json.
 *
 * Usage:
 *   node scripts/run.mjs <task> [-- <extra-args>]
 *   node scripts/run.mjs --parallel <pipeline> [-- <extra-args>]
 *   node scripts/run.mjs --sequential <pipeline> [-- <extra-args>]
 *
 * Extra args after `--`:
 *   --testPathPattern=<x>  propagated as env to all pipeline tasks (dump + puppeteer
 *                          compute matching run IDs from the same env var)
 *   --theme=<x>            same — propagated as env
 *   anything else          appended to commands of tasks with "passthrough": true
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runStep, ParallelSpinner, isTTY } from './utils/run-step.mjs';
import { runScheduled } from './utils/scheduler.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(currentDir, '..');
const BIN = resolve(ROOT, 'node_modules', '.bin');
const PATH_SEP = process.platform === 'win32' ? ';' : ':';
// On Windows PATH may be stored as 'Path' — fall back to avoid injecting the literal "undefined".
const sysPath = process.env.PATH ?? process.env.Path ?? '';
const envPATH = [BIN, resolve(ROOT, '..', 'node_modules', '.bin'), sysPath].join(PATH_SEP);

// Load task registry.
const registry = JSON.parse(readFileSync(resolve(currentDir, 'tasks.json'), 'utf-8'));
const TASKS = registry.tasks;
const PIPELINES = registry.pipelines;

// --- Argument parsing ---

const rawArgs = process.argv.slice(2);
const separatorIdx = rawArgs.indexOf('--');
const mainArgs = separatorIdx === -1 ? rawArgs : rawArgs.slice(0, separatorIdx);

// Normalize space-separated flag values to --flag=value form so all downstream
// code sees a consistent format. Only flags that take a value are listed here;
// boolean flags (--watch, --random, --verbose) are left as-is.
const FLAGS_WITH_VALUES = ['--testPathPattern', '--theme'];

/**
 * Normalizes space-separated flag values to `--flag=value` form.
 * e.g. `--testPathPattern filters` → `--testPathPattern=filters`
 *
 * @param {string[]} args Raw argument array to normalize.
 * @returns {string[]} Normalized argument array.
 */
function normalizeArgs(args) {
  const result = [];

  for (let i = 0; i < args.length; i += 1) {
    if (FLAGS_WITH_VALUES.includes(args[i]) && i + 1 < args.length) {
      result.push(`${args[i]}=${args[i + 1]}`);
      i += 1;
    } else {
      result.push(args[i]);
    }
  }

  return result;
}

const extraArgs = normalizeArgs(separatorIdx === -1 ? [] : rawArgs.slice(separatorIdx + 1));

const isParallel = mainArgs[0] === '--parallel';
const isSequential = mainArgs[0] === '--sequential';
const pipelineName = (isParallel || isSequential) ? mainArgs[1] : null;
// Normalize before filtering so space-separated `--flag value` pairs are joined
// into `--flag=value` before the bare value token is discarded.
const normalizedMain = normalizeArgs(mainArgs);
// Filter flags out of taskNames: npm sometimes strips '--', landing flags in mainArgs.
const taskNames = (isParallel || isSequential) ? [] : normalizedMain.filter(a => !a.startsWith('--'));

// npm sometimes strips the '--' separator when forwarding `npm run cmd -- --flag`
// extra args, so flags land in mainArgs past the task/pipeline position.
// Recover them so `npm run task -- --flag` behaves the same as explicit argv.
const mainFlagStart = pipelineName !== null ? 2 : taskNames.length;
const recoveredFromMain = normalizedMain.slice(mainFlagStart).filter(a => a.startsWith('--'));

// `npm run task --flag=val` (no '--') sets npm_config_* in env but never adds
// to argv. Read those so unit tests behave like e2e (which reads env directly).
const recoveredFromEnv = [];
const envPattern = process.env.npm_config_testPathPattern || process.env.npm_config_testpathpattern;
const envTheme = process.env.npm_config_theme;
// Dedup against both extraArgs and recoveredFromMain to avoid double-passing a flag.
const alreadyRecovered = [...extraArgs, ...recoveredFromMain];

if (envPattern && !alreadyRecovered.some(a => a.startsWith('--testPathPattern='))) {
  recoveredFromEnv.push(`--testPathPattern=${envPattern}`);
}
if (envTheme && !alreadyRecovered.some(a => a.startsWith('--theme='))) {
  recoveredFromEnv.push(`--theme=${envTheme}`);
}

const allExtraArgs = [...extraArgs, ...recoveredFromMain, ...recoveredFromEnv];

// Extract special env-propagated flags from all extra args.
const patternArg = allExtraArgs.find(a => a.startsWith('--testPathPattern='));
const themeArg = allExtraArgs.find(a => a.startsWith('--theme='));
// testPathPattern and theme are propagated as env to all pipeline tasks so that
// the dump step (rspack) and run-puppeteer.mjs compute the same run-ID filename.
// For test:unit.jest, --testPathPattern= is also passed as argv (passthrough task),
// which Jest accepts directly; puppeteer ignores the duplicate argv entry.
// --verbose may appear anywhere in rawArgs: npm strips the '--' separator when
// forwarding extra args so it lands in mainArgs, not extraArgs.
const isVerbose = rawArgs.includes('--verbose');
// Do NOT strip --verbose from passthroughFlags — puppeteer tasks list it in
// their passthroughFilter and need it forwarded. buildCmd()'s passthroughFilter
// already prevents it from reaching tasks that don't expect it (e.g. build tasks).
const passthroughFlags = allExtraArgs;

const propagatedEnv = {};

if (patternArg) {
  propagatedEnv.npm_config_testpathpattern = patternArg.replace('--testPathPattern=', '');
}
if (themeArg) {
  propagatedEnv.npm_config_theme = themeArg.replace('--theme=', '');
}

// --- Task resolution ---

/**
 * @param {string} name Task name from tasks.json.
 * @returns {object} Task definition.
 */
function resolveTask(name) {
  const task = TASKS[name];

  if (!task) {
    // eslint-disable-next-line no-console
    console.error(`\x1b[31mUnknown task: "${name}"\x1b[0m`);
    // eslint-disable-next-line no-console
    console.error(`Available tasks: ${Object.keys(TASKS).join(', ')}`);
    process.exit(1);
  }

  return task;
}

/**
 * @param {object} task Task definition from tasks.json.
 * @param {string[]} flags Extra flags passed after `--`.
 * @returns {string} Mode string: 'quiet' | 'inherit' | 'interactive'.
 */
function resolveMode(task, flags) {
  if (task.mode === 'interactive' || (task.mode === 'inherit' && flags.includes('--watch'))) {
    return 'interactive';
  }

  if (task.mode === 'inherit') {
    return 'inherit';
  }

  // --verbose: stream stdout/stderr directly so tools like tsc that write errors to stdout
  // are not silently swallowed by quiet mode's stderr-only capture.
  if (isVerbose) {
    return 'inherit';
  }

  // Tasks with no explicit mode that forward --watch must use inherit so their stdout
  // reaches concurrently's output stream — the watcher reads it to detect build-completion
  // markers and trigger Puppeteer re-runs. Without this, output is piped and swallowed.
  const forwardsWatch = Array.isArray(task.passthroughFilter) && task.passthroughFilter.includes('--watch');

  if (flags.includes('--watch') && forwardsWatch) {
    return 'inherit';
  }

  return 'quiet';
}

/**
 * @param {object} task Task definition from tasks.json.
 * @param {string[]} flags Extra flags to append when task has `passthrough: true`.
 * @returns {string} Final shell command string.
 */
function buildCmd(task, flags) {
  const base = task.cmd;
  let effective = flags;

  // passthroughFilter restricts which flags reach this task — e.g. test:unit.jest
  // should receive --testPathPattern/--watch but not --random (which Jest rejects).
  if (task.passthroughFilter && flags.length) {
    effective = flags.filter(f =>
      task.passthroughFilter.some(p => f === p || f.startsWith(`${p}=`))
    );
  }

  const extra = (task.passthrough && effective.length) ? ` ${effective.join(' ')}` : '';

  return `${base}${extra}`;
}

// --- Single task runner (sequential) ---

/**
 * @param {string} name Task name.
 * @param {string[]} [extraFlags] Passthrough flags appended to the command.
 * @param {object} [envOverride] Additional env vars for this invocation.
 * @param {Set<string>} [visited] Tasks already executed in this run; shared
 *   across recursive dep calls so shared deps are not re-executed.
 * @returns {Promise<void>} Resolves on success, rejects on non-zero exit.
 */
async function runOne(name, extraFlags = [], envOverride = {}, visited = new Set()) {
  // Deduplication: skip tasks already executed in this run.
  // Without this, shared deps (e.g. build:styles) re-execute once per downstream
  // task that has them in its dep chain, roughly doubling sequential build time.
  if (visited.has(name)) {
    return;
  }

  visited.add(name);

  const task = resolveTask(name);
  const mode = resolveMode(task, extraFlags);
  const cmd = buildCmd(task, extraFlags);
  const cwd = task.cwd ? resolve(ROOT, task.cwd) : ROOT;
  // Inject node_modules/.bin so task cmds like `eslint`, `rimraf`, `rspack`
  // resolve without requiring callers to prefix with npx or npm run.
  const env = { PATH: envPATH, ...propagatedEnv, ...envOverride };

  // For direct single-task invocations, resolve deps sequentially so that
  // e.g. `npm run build:umd` automatically builds styles first.
  // The parallel pipeline uses runParallelTask + the DAG scheduler instead
  // and never goes through runOne, so this path does not affect it.
  for (const dep of (task.deps ?? [])) {
    // eslint-disable-next-line no-await-in-loop
    await runOne(dep, [], envOverride, visited);
  }

  await runStep(cmd, {
    cwd,
    env,
    forceInherit: mode === 'inherit',
    interactive: mode === 'interactive',
  });
}

// --- Parallel task runner (used by the scheduler for the build pipeline) ---

/**
 * @param {string} name Task name.
 * @param {ParallelSpinner} spinner Spinner managing the parallel progress display.
 * @returns {Promise<number>} Resolves with elapsed ms on success, rejects on failure.
 */
function runParallelTask(name, spinner) {
  return new Promise((res, rej) => {
    const task = resolveTask(name);
    const cmd = buildCmd(task, passthroughFlags);
    const cwd = task.cwd ? resolve(ROOT, task.cwd) : ROOT;
    const start = performance.now();

    // On Windows process.env may have 'Path' instead of 'PATH'. Delete it so
    // our injected PATH is the only path-like key — Windows GetEnvironmentVariable
    // picks the first case-insensitive match, which would otherwise be 'Path'.
    const baseEnv = { ...process.env };

    if (process.platform === 'win32') {
      delete baseEnv.Path;
    }

    // In verbose mode use inherit so tools write directly to the terminal —
    // many CLI tools (including rspack) suppress output when stdout is piped.
    const stdio = isVerbose ? 'inherit' : ['ignore', 'pipe', 'pipe'];

    const child = spawn(cmd, [], {
      cwd,
      env: { ...baseEnv, PATH: envPATH, NODE_NO_WARNINGS: '1', ...propagatedEnv },
      stdio,
      shell: true,
    });

    let combined = '';

    if (!isVerbose) {
      child.stdout.on('data', (d) => {
        combined += d.toString();
      });
      child.stderr.on('data', (d) => {
        combined += d.toString();
      });
    }

    child.on('close', (code) => {
      const elapsed = Math.round(performance.now() - start);

      if (code !== 0) {
        spinner.finish(name, false, elapsed);

        if (combined) {
          const tail = combined.trim().split('\n').slice(-10).join('\n    ');

          process.stderr.write(`\n    ${tail}\n`);
        }
        rej(new Error(`${name} failed with exit code ${code}`));
      } else {
        spinner.finish(name, true, elapsed);

        // In CI (non-TTY) flush all captured output for log collectors.
        // On TTY the spinner ✓ line is sufficient; use --verbose to see output.
        if (!isVerbose && !isTTY && combined.trim()) {
          process.stdout.write(`${combined.trimEnd()}\n`);
        }

        res(elapsed);
      }
    });

    child.on('error', (err) => {
      spinner.finish(name, false, 0);
      rej(err);
    });
  });
}

// --- Pipeline runner ---

/**
 * @param {string} name Pipeline name from tasks.json.
 * @param {boolean} parallel When true, uses the DAG scheduler; otherwise sequential.
 * @returns {Promise<void>} Resolves when all pipeline steps complete.
 */
async function runPipeline(name, parallel) {
  const pipeline = PIPELINES[name];

  if (!pipeline) {
    // eslint-disable-next-line no-console
    console.error(`\x1b[31mUnknown pipeline: "${name}"\x1b[0m`);
    // eslint-disable-next-line no-console
    console.error(`Available pipelines: ${Object.keys(PIPELINES).join(', ')}`);
    process.exit(1);
  }

  // before: sequential prerequisites (e.g. clean before build, build:styles before lint)
  for (const step of (pipeline.before ?? [])) {
    // before steps may be pipeline names (e.g. "lint" in "test") or task names
    if (PIPELINES[step]) {
      await runPipeline(step, false);
    } else {
      await runOne(step);
    }
  }

  const tasks = pipeline.tasks ?? [];

  if (parallel) {
    // Build a subset of TASKS containing only the pipeline's tasks.
    const subTasks = {};

    tasks.forEach((t) => {
      subTasks[t] = TASKS[t] ?? { cmd: t, deps: [] };
    });

    const spinner = isVerbose ? { start: () => {}, finish: () => {} } : new ParallelSpinner();
    const totalStart = performance.now();

    try {
      await runScheduled(subTasks, (taskName) => {
        spinner.start(taskName);

        return runParallelTask(taskName, spinner);
      }, isTTY);
    } catch (err) {
      const totalElapsed = Math.round(performance.now() - totalStart);

      // eslint-disable-next-line no-console
      console.error(`\n\x1b[31mPipeline "${name}" failed after ${totalElapsed}ms\x1b[0m`);
      process.exit(1);
    }

  } else {
    // Sequential: run each item in order.
    // Items may be pipeline names (e.g. "test:unit" inside "test") or task names.
    // A single visited Set is shared across all items so shared deps run only once.
    const visited = new Set();

    for (const item of tasks) {
      if (PIPELINES[item]) {
        // eslint-disable-next-line no-await-in-loop
        await runPipeline(item, false);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await runOne(item, passthroughFlags, {}, visited);
      }
    }
  }

  // after: sequential post-steps (e.g. prepare-package-for-publish after build)
  for (const step of (pipeline.after ?? [])) {
    if (PIPELINES[step]) {
      // eslint-disable-next-line no-await-in-loop
      await runPipeline(step, false);
    } else {
      // eslint-disable-next-line no-await-in-loop
      await runOne(step);
    }
  }
}

// --- Entry point ---

try {
  if (pipelineName) {
    await runPipeline(pipelineName, isParallel);
  } else if (taskNames.length > 0) {
    for (const name of taskNames) {
      await runOne(name, passthroughFlags);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/run.mjs <task|--parallel pipeline|--sequential pipeline> [-- flags]');
    process.exit(1);
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(`\n\x1b[31m${err.message}\x1b[0m`);
  process.exit(1);
}
