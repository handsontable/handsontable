import { test } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { injectHookTimer, getHookTiming } from '../../lib/hook-timing.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot);

  // Inject hook timing for sort measurement
  await injectHookTimer(page, 'beforeColumnSort', 'afterColumnSort');

  const hookDeltas: number[] = [];
  const outputDir = path.resolve('output', config.name);

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir,
    actionFn: async() => {
      // Sort column 0 ascending
      await page.evaluate(() => {
        const hot = (window as any).__hot;
        const sortPlugin = hot.getPlugin('columnSorting');

        sortPlugin.sort({ column: 0, sortOrder: 'asc' });
      });

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

      // Re-inject hook timer
      await injectHookTimer(page, 'beforeColumnSort', 'afterColumnSort');
    },
  });

  // Save hook timing data alongside traces
  if (hookDeltas.length > 0) {
    const avgDelta = hookDeltas.reduce((a, b) => a + b, 0) / hookDeltas.length;

    await writeFile(
      path.join(outputDir, 'hook-timing.json'),
      JSON.stringify({ deltas: hookDeltas, averageDeltaMs: avgDelta }, null, 2),
      'utf8',
    );
  }
});
