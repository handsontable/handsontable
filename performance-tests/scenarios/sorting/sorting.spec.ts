import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { injectHookTimer, getHookTiming, saveHookTimings } from '../../lib/hook-timing.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot);

  // Inject hook timing for sort measurement
  await injectHookTimer(page, 'beforeColumnSort', 'afterColumnSort');

  const hookDeltas: number[] = [];
  const outputDir = path.resolve('output', config.name);
  let sortAscending = true;

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir,
    actionFn: async() => {
      const sortOrder = sortAscending ? 'asc' : 'desc';

      // Alternate sort direction across iterations
      await page.evaluate((order) => {
        const hot = (window as any).__hot;
        const sortPlugin = hot.getPlugin('columnSorting');

        sortPlugin.sort({ column: 0, sortOrder: order });
      }, sortOrder);

      sortAscending = !sortAscending;

      // Capture hook timing
      const timing = await getHookTiming(page, 'beforeColumnSort', 'afterColumnSort');

      if (timing.deltaMs != null) {
        hookDeltas.push(timing.deltaMs);
      }
    },
    resetFn: async() => {
      // Clear sort between iterations
      await page.evaluate(() => {
        const hot = (window as any).__hot;
        const sortPlugin = hot.getPlugin('columnSorting');

        sortPlugin.clearSort();
      });

      // Reset hook timer store for next iteration
      await injectHookTimer(page, 'beforeColumnSort', 'afterColumnSort');
    },
  });

  // Discard warmup deltas -- actionFn runs during warmup too
  const measuredDeltas = hookDeltas.slice(config.warmupRuns);

  await saveHookTimings(outputDir, measuredDeltas);
});
