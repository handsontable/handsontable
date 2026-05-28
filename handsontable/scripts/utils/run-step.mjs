// TTY-aware spawn helper for build/test wrapper scripts.
//
// On TTY (quiet steps):   suppress output, show spinner after 50ms, print ✓/✗.
// On TTY (inherit steps): pipe output through Node so spinner clears before first
//                         output line; show ✓ if the command exits silently.
// On CI/non-TTY:          inherit all stdio — full output flows through unchanged.
//
// For parallel tasks, use ParallelSpinner to render one spinner line per running
// task using ANSI cursor movement.  Falls back gracefully on non-TTY.

import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

// HOT_QUIET=1 lets parent processes (e.g. the watch watcher) signal that child
// scripts should suppress output even when concurrently breaks the TTY pipe.
export const isTTY = process.stdout.isTTY || process.env.HOT_QUIET === '1';

const SUPPRESS_ENV = {
  NODE_NO_WARNINGS: '1',
};

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const INDICATOR_DELAY_MS = 80;
const INDICATOR_INTERVAL_MS = 80;

/**
 * @param {string} cmd Shell command string.
 * @returns {string} Human-readable label with npm prefix stripped.
 */
function labelOf(cmd) {
  return cmd
    .replace(/^npm --silent run /, '')
    .replace(/^npm run /, '')
    .trim();
}

/**
 * Spawn a shell command with TTY-aware output suppression and progress indicator.
 *
 * @param {string} cmd Full shell command string to execute.
 * @param {{ forceInherit?: boolean, interactive?: boolean, cwd?: string, env?: object, label?: string }} [opts]
 *   forceInherit: show command output (linters, Puppeteer) with spinner while waiting.
 *   interactive: full stdio pass-through for tools that need a real TTY (Jest --watch).
 *                No spinner — output flows directly and keyboard input is forwarded.
 *   cwd: working directory (defaults to process.cwd()).
 *   env: extra env vars merged on top of process.env and SUPPRESS_ENV.
 *   label: display name for the spinner/result line (defaults to cmd with npm prefix stripped).
 * @returns {Promise<void>} Rejects with an Error on non-zero exit.
 */
export function runStep(cmd, opts = {}) {
  const quiet = isTTY && !opts.forceInherit && !opts.interactive;
  const label = opts.label ?? labelOf(cmd);

  return new Promise((resolve, reject) => {
    const start = performance.now();
    let frame = 0;
    let indicatorActive = false;
    let delayTimer = null;
    let spinTimer = null;
    let hasOutput = false;

    // --- spinner ---

    const startSpinner = () => {
      if (!isTTY || opts.interactive) {
        return;
      }
      delayTimer = setTimeout(() => {
        indicatorActive = true;
        spinTimer = setInterval(() => {
          process.stdout.write(`\r  \x1b[36m${SPINNER[frame % SPINNER.length]}\x1b[0m ${label}`);
          frame += 1;
        }, INDICATOR_INTERVAL_MS);
      }, INDICATOR_DELAY_MS);
    };

    const stopIndicator = () => {
      clearTimeout(delayTimer);

      if (spinTimer) {
        clearInterval(spinTimer);
        spinTimer = null;
      }
      if (indicatorActive) {
        process.stdout.write('\r\x1b[K');
        indicatorActive = false;
      }
    };

    // --- stdio ---

    // interactive: full pass-through so tools like Jest --watch get a real TTY.
    // TTY (non-interactive): pipe so we can intercept output for the spinner.
    // CI/non-TTY: inherit directly — Node buffering would break streaming output.
    const stdio = opts.interactive || !isTTY
      ? 'inherit'
      : ['ignore', 'pipe', 'pipe'];

    startSpinner();

    // On Windows process.env may have 'Path' instead of 'PATH'. Remove it so
    // the caller-supplied PATH (in opts.env) is the only path-like key in the
    // env block — Windows GetEnvironmentVariable picks the first case-insensitive
    // match, which would otherwise be the original 'Path', ignoring our injection.
    const baseEnv = { ...process.env };

    if (process.platform === 'win32') {
      delete baseEnv.Path;
    }

    const child = spawn(cmd, [], {
      cwd: opts.cwd ?? process.cwd(),
      env: { ...baseEnv, ...SUPPRESS_ENV, ...opts.env },
      stdio,
      shell: true,
    });

    // --- output handling (TTY only) ---

    let stderr = '';

    if (isTTY && !opts.interactive) {
      const onData = (destination, data) => {
        if (!hasOutput) {
          hasOutput = true;
          stopIndicator(); // clear spinner before first line of real output
        }
        if (!quiet) {
          destination.write(data); // forceInherit: forward to terminal
        } else if (destination === process.stderr) {
          stderr += data.toString(); // quiet: capture stderr
        }
      };

      child.stdout.on('data', data => onData(process.stdout, data));
      child.stderr.on('data', data => onData(process.stderr, data));
    }

    // --- completion ---

    child.on('close', (code) => {
      stopIndicator();
      const elapsed = Math.round(performance.now() - start);

      if (code !== 0) {
        if (quiet) {
          process.stdout.write(`  \x1b[31m✗\x1b[0m ${label} (${elapsed}ms)\n`);

          if (stderr) {
            const tail = stderr.trim().split('\n').slice(-3).join('\n    ');

            process.stderr.write(`\n    ${tail}\n`);
          }
        }
        reject(new Error(`Step failed (exit ${code}): ${cmd}`));
      } else {
        // Show ✓ for quiet steps, and for inherit steps that produced no output
        // (e.g. eslint passing cleanly — no output means no news is good news).
        if (quiet || !hasOutput) {
          process.stdout.write(`  \x1b[32m✓\x1b[0m ${label} (${elapsed}ms)\n`);
        }
        resolve();
      }
    });

    child.on('error', (err) => {
      stopIndicator();
      reject(err);
    });
  });
}

/**
 * Multi-line spinner for parallel builds.
 *
 * Usage:
 *   const spinner = new ParallelSpinner();
 *   spinner.start('task-a');
 *   spinner.start('task-b');
 *   spinner.finish('task-a', true, 1200);
 *   spinner.stop();   // clears any remaining lines
 *
 * On non-TTY each event is printed as a plain line (no ANSI cursor movement).
 */
export class ParallelSpinner {
  #active = new Map(); // name → {frame, startMs}
  #timer = null;
  #lineCount = 0;

  start(name) {
    this.#active.set(name, { frame: 0, startMs: performance.now() });

    if (!isTTY) {
      // eslint-disable-next-line no-console
      console.log(`  \x1b[36m…\x1b[0m ${name}`);

      return;
    }

    if (!this.#timer) {
      this.#timer = setInterval(() => this.#render(), INDICATOR_INTERVAL_MS);
    }

    this.#render();
  }

  finish(name, ok, elapsed) {
    const mark = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';

    if (!isTTY) {
      // eslint-disable-next-line no-console
      console.log(`  ${mark} ${name} (${elapsed}ms)`);
      this.#active.delete(name);

      return;
    }

    this.#active.delete(name);
    this.#clear();
    process.stdout.write(`  ${mark} ${name} (${elapsed}ms)\n`);
    this.#render();

    if (this.#active.size === 0) {
      this.stop();
    }
  }

  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }

    this.#clear();
  }

  #clear() {
    if (!isTTY || this.#lineCount === 0) {
      return;
    }
    // Move up and erase each spinner line.
    process.stdout.write(('\x1b[1A\x1b[K').repeat(this.#lineCount));
    this.#lineCount = 0;
  }

  #render() {
    if (!isTTY || this.#active.size === 0) {
      return;
    }
    this.#clear();

    for (const [name, state] of this.#active) {
      const spin = SPINNER[state.frame % SPINNER.length];

      state.frame += 1;
      process.stdout.write(`  \x1b[36m${spin}\x1b[0m ${name}\n`);
      this.#lineCount += 1;
    }
  }
}
