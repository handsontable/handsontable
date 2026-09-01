// CDP tracing orchestration -- start/stop Chrome DevTools Protocol traces
// and run scenario actions with warmup + measured iterations.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { MEASURE_START_MARK, MEASURE_END_MARK } from '../trace-parser.mjs';

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<import('playwright-core').CDPSession>} CDP session handle
 */
export async function startTracing(page) {
  const cdp = await page.context().newCDPSession(page);

  await cdp.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'v8.execute',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-v8.cpu_profiler',
      // Carries performance.mark, which is how the measurement window is bounded.
      'blink.user_timing',
    ].join(','),
    transferMode: 'ReturnAsStream',
  });

  return cdp;
}

/**
 * @param {import('playwright-core').CDPSession} cdp
 * @returns {Promise<string>} trace JSON string
 */
export async function stopTracing(cdp) {
  const traceJson = await new Promise((resolve, reject) => {
    cdp.on('Tracing.tracingComplete', async({ stream }) => {
      try {
        let result = '';

        while (true) {
          const { data, eof, base64Encoded } = await cdp.send('IO.read', {
            handle: stream ?? '',
            size: 65536,
          });

          result += base64Encoded
            ? Buffer.from(data, 'base64').toString('utf-8')
            : data;

          if (eof) {
            break;
          }
        }

        await cdp.send('IO.close', { handle: stream ?? '' });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    cdp.send('Tracing.end');
  });

  return traceJson;
}

/**
 * Mark a point in the trace, bounding the region the parser will measure.
 *
 * Without an explicit window the parser auto-zooms onto the busiest part of the
 * trace, which for a page.evaluate-driven action is the V8 interrupt CDP uses to
 * enter the isolate, not the grid work. See measurementWindowFromMarks().
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} markName
 */
async function mark(page, markName) {
  // Block body on purpose: a concise arrow returns the PerformanceMark, which Playwright
  // then serializes and ships back across CDP -- a round trip inside the window, and a
  // dependency on the serializer accepting that object at all.
  await page.evaluate((name) => {
    performance.mark(name);
  }, markName);
}

/**
 * Upper bound on how long the post-action settle may wait, in milliseconds.
 */
const SETTLE_TIMEOUT_MS = 1000;

/**
 * Wait for the work an action queued to reach the compositor.
 *
 * Without this the trace is stopped on the same turn the action returns, so the
 * rendering and painting that follow the last JS turn fall outside the trace
 * window and are recorded as zero. A category measured as exactly 0 is not a
 * cheap operation -- it is a capture that ended too early.
 *
 * Two animation frames, because the paint for frame N happens after frame N's
 * callbacks: once frame N+1's callback runs, frame N has been committed. The
 * idle callback then catches trailing work (deferred layout, async paint).
 *
 * The whole wait races a timer, not just the idle callback: requestAnimationFrame
 * does not fire at all in a throttled or occluded page, so without the race a
 * stalled renderer would hang until Playwright's per-test timeout instead of the
 * bound named here.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeoutMs=SETTLE_TIMEOUT_MS] -- upper bound for the whole wait, frames included
 * @returns {Promise<boolean>} true when the settle completed, false when the bound expired first
 */
export async function settleFrames(page, timeoutMs = SETTLE_TIMEOUT_MS) {
  return page.evaluate(timeout => new Promise((resolve) => {
    // The ceiling races the animation frames, so a frame that needs more main-thread
    // work than the bound can lose it. That would close the window before Paint and
    // Commit and hand back painting: 0 with the marks still in place -- indistinguishable
    // from a cheap operation. Report it instead of resolving silently.
    const bail = setTimeout(() => resolve(false), timeout);
    const finish = () => {
      clearTimeout(bail);
      resolve(true);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const idle = /** @type {any} */ (window).requestIdleCallback;

        if (typeof idle === 'function') {
          idle(finish, { timeout });
        } else {
          setTimeout(finish, 0);
        }
      });
    });
  }), timeoutMs);
}

/**
 * @param {object} options
 * @param {import('@playwright/test').Page} options.page
 * @param {(isMeasured: boolean) => Promise<void>} options.actionFn -- the traced action; receives true during measured iterations, false during warmup
 * @param {() => Promise<void>} [options.setupFn] -- pre-trace setup (run once before warmup)
 * @param {() => Promise<void>} [options.resetFn] -- reset state between iterations
 * @param {() => Promise<void>} [options.afterActionFn] -- runs after the measured window closes,
 *   on measured iterations only; put readbacks here so their CDP round trip is not billed to
 *   the action
 * @param {() => Promise<void>} [options.settleFn] -- overrides the default post-action settle
 * @param {boolean} [options.skipSettle=false] -- opt out of the in-window settle only; the settles
 *   after setupFn and resetFn always run, since their frames would otherwise leak into the
 *   next measured window
 * @param {number} [options.warmupRuns=1]
 * @param {number} [options.iterations=3]
 * @param {string} options.outputDir -- where to write trace JSON files
 */
export async function runTracedScenario({
  page,
  actionFn,
  setupFn,
  resetFn,
  afterActionFn,
  settleFn,
  skipSettle = false,
  warmupRuns = 1,
  iterations = 3,
  outputDir,
}) {
  await mkdir(outputDir, { recursive: true });

  const settle = async(label) => {
    const settled = settleFn ? await settleFn() : await settleFrames(page);

    // settleFn is free to return nothing; only an explicit false means the bound expired.
    if (settled === false) {
      console.warn(`\n  WARN: settle after ${label} hit its ${SETTLE_TIMEOUT_MS} ms bound; ` +
        'the frame may not have reached the compositor, so rendering and painting for this ' +
        'iteration may be understated.');
    }
  };

  // Preparation settles unconditionally, and skipSettle does not reach it. A reset renders
  // synchronously but paints a frame later, and specs wait only for the render -- cell-editing
  // waits on countRenderedRows(), scrollToRow's waitForFunction reports trimming rather than
  // scroll position. That paint would otherwise land in the next iteration's window and be
  // billed to the next action. Opting out of measuring a frame is a scenario's call; opting
  // into a contaminated window is not.
  const settleAfterPrepare = label => settle(label);

  // Run setup once (e.g., scrollViewportTo for scroll-up)
  if (setupFn) {
    process.stdout.write('  Setup...');
    await setupFn();
    await settleAfterPrepare('setup');
    console.log(' done');
  }

  // Warmup runs (no tracing)
  for (let w = 0; w < warmupRuns; w++) {
    process.stdout.write(`  Warmup ${w + 1}/${warmupRuns}...`);
    await actionFn(false);

    if (!skipSettle) {
      await settle('warmup action');
    }

    console.log(' done');

    if (resetFn) {
      await resetFn();
      await settleAfterPrepare('reset');
    }
  }

  // Measured iterations
  for (let i = 1; i <= iterations; i++) {
    process.stdout.write(`  Iteration ${i}/${iterations}: tracing`);

    const cdp = await startTracing(page);

    // Heartbeat: print dots during actionFn to keep GH Actions log alive
    const heartbeat = setInterval(() => process.stdout.write('.'), 5000);

    // The mark is taken after CDP has already entered the isolate once, so the
    // interrupt that carries it stays outside the window it opens.
    await mark(page, MEASURE_START_MARK);

    await actionFn(true);

    // Inside the window on purpose: the frame this waits for is the work being measured.
    if (!skipSettle) {
      await settle(`iteration ${i}`);
    }

    await mark(page, MEASURE_END_MARK);

    // Outside the window: a readback here is harness overhead, not measured work.
    if (afterActionFn) {
      await afterActionFn();
    }

    clearInterval(heartbeat);

    process.stdout.write(' stopping');
    const traceJson = await stopTracing(cdp);

    const outPath = join(outputDir, `iteration-${i}.json`);

    await writeFile(outPath, traceJson);
    console.log(` saved (${(traceJson.length / 1024).toFixed(0)} KB)`);

    if (resetFn && i < iterations) {
      await resetFn();
      await settleAfterPrepare('reset');
    }
  }
}
