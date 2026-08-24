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
 * @param {object} options
 * @param {import('@playwright/test').Page} options.page
 * @param {(isMeasured: boolean) => Promise<void>} options.actionFn -- the traced action; receives true during measured iterations, false during warmup
 * @param {() => Promise<void>} [options.setupFn] -- pre-trace setup (run once before warmup)
 * @param {() => Promise<void>} [options.resetFn] -- reset state between iterations
 * @param {number} [options.warmupRuns=1]
 * @param {number} [options.iterations=3]
 * @param {string} options.outputDir -- where to write trace JSON files
 */
export async function runTracedScenario({
  page,
  actionFn,
  setupFn,
  resetFn,
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
