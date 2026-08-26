// CDP tracing orchestration -- start/stop Chrome DevTools Protocol traces
// and run scenario actions with warmup + measured iterations.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

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
 * idle callback then catches trailing work (deferred layout, async paint), and
 * is bounded so a busy main thread cannot hang the run.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeoutMs=SETTLE_TIMEOUT_MS] -- upper bound for the idle wait
 */
export async function settleFrames(page, timeoutMs = SETTLE_TIMEOUT_MS) {
  await page.evaluate(timeout => new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const idle = /** @type {any} */ (window).requestIdleCallback;

        if (typeof idle === 'function') {
          idle(() => resolve(null), { timeout });
        } else {
          setTimeout(() => resolve(null), 0);
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
 * @param {() => Promise<void>} [options.settleFn] -- overrides the default post-action settle
 * @param {boolean} [options.skipSettle=false] -- opt out of settling before the trace stops
 * @param {number} [options.warmupRuns=1]
 * @param {number} [options.iterations=3]
 * @param {string} options.outputDir -- where to write trace JSON files
 */
export async function runTracedScenario({
  page,
  actionFn,
  setupFn,
  resetFn,
  settleFn,
  skipSettle = false,
  warmupRuns = 1,
  iterations = 3,
  outputDir,
}) {
  await mkdir(outputDir, { recursive: true });

  // Run setup once (e.g., scrollViewportTo for scroll-up)
  if (setupFn) {
    process.stdout.write('  Setup...');
    await setupFn();
    console.log(' done');
  }

  // Warmup runs (no tracing)
  for (let w = 0; w < warmupRuns; w++) {
    process.stdout.write(`  Warmup ${w + 1}/${warmupRuns}...`);
    await actionFn(false);

    if (!skipSettle) {
      await (settleFn ? settleFn() : settleFrames(page));
    }

    console.log(' done');

    if (resetFn) {
      await resetFn();
    }
  }

  // Measured iterations
  for (let i = 1; i <= iterations; i++) {
    process.stdout.write(`  Iteration ${i}/${iterations}: tracing`);

    const cdp = await startTracing(page);

    // Heartbeat: print dots during actionFn to keep GH Actions log alive
    const heartbeat = setInterval(() => process.stdout.write('.'), 5000);

    await actionFn(true);

    // Inside the trace on purpose: the frame this waits for is the work being measured.
    if (!skipSettle) {
      await (settleFn ? settleFn() : settleFrames(page));
    }

    clearInterval(heartbeat);

    process.stdout.write(' stopping');
    const traceJson = await stopTracing(cdp);

    const outPath = join(outputDir, `iteration-${i}.json`);

    await writeFile(outPath, traceJson);
    console.log(` saved (${(traceJson.length / 1024).toFixed(0)} KB)`);

    if (resetFn && i < iterations) {
      await resetFn();
    }
  }
}
