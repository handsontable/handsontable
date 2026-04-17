/**
 * Parallel build orchestrator for Handsontable.
 * Runs build steps concurrently where the dependency graph allows.
 *
 * Usage: node scripts/parallel-build.mjs
 */
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(currentDir, '..');
const BIN = resolve(ROOT, 'node_modules', '.bin');
const PATH_SEP = process.platform === 'win32' ? ';' : ':';
const envPATH = [BIN, resolve(ROOT, '..', 'node_modules', '.bin'), process.env.PATH].join(PATH_SEP);

// Build task definitions: { cmd, deps }
// eslint-disable-next-line quote-props
const tasks = {
  // Styles (no deps)
  'styles': { // eslint-disable-line quote-props
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=styles-development env-cmd -f ../hot.config.js rspack',
    deps: [],
  },
  'styles.min': {
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=styles-production env-cmd -f ../hot.config.js rspack',
    deps: ['styles'], // must run after styles to avoid race on src/styles/handsontableStyles.js
  },
  'themes-css': {
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=themes-css-development env-cmd -f ../hot.config.js rspack',
    deps: [],
  },
  'themes-css.min': {
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=themes-css-production env-cmd -f ../hot.config.js rspack',
    deps: [],
  },

  // Transpilation builds (need styles.min to finalize handsontableStyles.js before reading src/)
  'commonjs': { // eslint-disable-line quote-props
    cmd: 'env-cmd -f ../hot.config.js node scripts/swc-transpile.mjs --format commonjs --out-dir tmp',
    deps: ['styles.min'],
  },
  'languages': { // eslint-disable-line quote-props
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=languages-development env-cmd -f ../hot.config.js rspack',
    deps: [],
  },
  'languages.es': {
    cmd: 'env-cmd -f ../hot.config.js node scripts/swc-transpile.mjs --format esm'
      + ' --src-dir src/i18n/languages --out-dir languages --out-ext .mjs --lang-registration',
    deps: [],
  },
  'languages.min': {
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=languages-production env-cmd -f ../hot.config.js rspack',
    deps: [],
  },
  'themes-umd': {
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=themes-umd-development env-cmd -f ../hot.config.js rspack',
    deps: [],
  },
  'themes-umd.min': {
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=themes-umd-production env-cmd -f ../hot.config.js rspack',
    deps: [],
  },

  // UMD builds (need styles + themes-css)
  'umd': { // eslint-disable-line quote-props
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=development env-cmd -f ../hot.config.js rspack ./src/index.js',
    deps: ['styles', 'themes-css'],
  },
  'umd.min': {
    cmd: 'cross-env-shell BABEL_ENV=commonjs NODE_ENV=production env-cmd -f ../hot.config.js rspack ./src/index.js',
    deps: ['styles.min', 'themes-css.min'],
  },

  // ES module build (needs styles.min to finalize handsontableStyles.js)
  'es': { // eslint-disable-line quote-props
    cmd: 'env-cmd -f ../hot.config.js node scripts/swc-transpile.mjs --format esm --out-dir tmp --out-ext .mjs',
    deps: ['styles.min'],
  },
};

/**
 * Spawn a build task and return a promise that resolves with timing info.
 *
 * @param {string} name Task name from the tasks map.
 * @returns {Promise<{name: string, elapsed: number}>} Resolves on success.
 */
function runTask(name) {
  return new Promise((taskResolve, taskReject) => {
    const start = performance.now();
    const child = spawn(tasks[name].cmd, [], {
      cwd: ROOT,
      env: { ...process.env, PATH: envPATH },
      // We only read stderr for compact failure diagnostics.
      // Keep stdout ignored to avoid deadlock if a child writes enough data
      // to fill the pipe buffer while parent never consumes it.
      stdio: ['ignore', 'ignore', 'pipe'],
      shell: true,
    });

    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const elapsed = Math.round(performance.now() - start);

      if (code !== 0) {
        // eslint-disable-next-line no-console
        console.log(`  \x1b[31m✗\x1b[0m ${name} FAILED (${elapsed}ms)`);

        if (stderr) {
          // eslint-disable-next-line no-console
          console.error(`    ${stderr.trim().split('\n').slice(-3).join('\n    ')}`);
        }
        taskReject(new Error(`${name} failed with code ${code}`));
      } else {
        // eslint-disable-next-line no-console
        console.log(`  \x1b[32m✓\x1b[0m ${name} (${elapsed}ms)`);
        taskResolve({ name, elapsed });
      }
    });
  });
}

/**
 * Run all build tasks respecting the dependency graph with maximum parallelism.
 */
async function build() {
  const totalStart = performance.now();
  const taskNames = Object.keys(tasks);
  const completed = new Set();
  const running = new Map(); // name -> Promise
  const taskTimes = {};

  // Validate the dependency graph up front: every `deps` entry must reference
  // an existing task. A missing dep (typo, stale rename) would otherwise leave
  // the dependent task permanently unready, the loop would break out with
  // running.size === 0, and the build would falsely report success.
  const unknownDeps = [];

  taskNames.forEach((name) => {
    tasks[name].deps.forEach((dep) => {
      if (!Object.prototype.hasOwnProperty.call(tasks, dep)) {
        unknownDeps.push(`${name} -> "${dep}"`);
      }
    });
  });

  if (unknownDeps.length > 0) {
    throw new Error(
      `Unknown task dependency(ies): ${unknownDeps.join(', ')}. `
      + `Known tasks: ${taskNames.join(', ')}.`
    );
  }

  // eslint-disable-next-line no-console
  console.log('Building Handsontable (parallel)...\n');

  while (completed.size < taskNames.length) {
    // Find tasks that can start now
    const ready = taskNames.filter(name =>
      !completed.has(name) &&
      !running.has(name) &&
      tasks[name].deps.every(dep => completed.has(dep))
    );

    // Launch all ready tasks
    ready.forEach((name) => {
      const promise = runTask(name).then(
        (result) => {
          taskTimes[name] = result.elapsed;
          completed.add(name);
          running.delete(name);
        },
        (err) => {
          running.delete(name);
          throw err;
        }
      );

      running.set(name, promise);
    });

    if (running.size === 0) {
      // No ready task and nothing running, yet the completed set is short of
      // every declared task. Upfront validation should prevent this, but guard
      // against future cycles or logic bugs sneaking in -- a silent success
      // here would ship an incomplete build.
      const pending = taskNames.filter(n => !completed.has(n));

      throw new Error(
        `Build stalled: ${pending.length} task(s) never ran (${pending.join(', ')}). `
        + 'Check the dependency graph for cycles or unresolved deps.'
      );
    }

    // Wait for at least one running task to complete
    try {
      await Promise.race(running.values());
    } catch (err) {
      // Kill remaining tasks and exit
      const totalElapsed = Math.round(performance.now() - totalStart);

      // eslint-disable-next-line no-console
      console.error(`\n\x1b[31mBuild failed after ${totalElapsed}ms\x1b[0m`);
      process.exit(1);
    }
  }

  const totalElapsed = Math.round(performance.now() - totalStart);

  // eslint-disable-next-line no-console
  console.log(`\n\x1b[32mBuild complete in ${totalElapsed}ms (${(totalElapsed / 1000).toFixed(1)}s)\x1b[0m`);

  // Show critical path
  /**
   * Calculate the total time for a task including its dependency chain.
   *
   * @param {string} name Task name.
   * @returns {number} Total path time in milliseconds.
   */
  function pathTime(name) {
    const depMax = tasks[name].deps.length > 0
      ? Math.max(...tasks[name].deps.map(pathTime))
      : 0;

    return (taskTimes[name] || 0) + depMax;
  }

  let maxTask = '';
  let maxTime = 0;

  taskNames.forEach((name) => {
    const t = pathTime(name);

    if (t > maxTime) {
      maxTime = t;
      maxTask = name;
    }
  });

  const critPath = [];
  let current = maxTask;

  critPath.push(current);

  while (tasks[current].deps.length > 0) {
    const deps = tasks[current].deps;

    current = deps.reduce((a, b) => (pathTime(a) > pathTime(b) ? a : b));
    critPath.unshift(current);
  }

  // eslint-disable-next-line no-console
  console.log(`Critical path: ${critPath.join(' -> ')} (${maxTime}ms theoretical minimum)`);
}

build().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`\n\x1b[31m${err.message}\x1b[0m`);
  process.exit(1);
});
