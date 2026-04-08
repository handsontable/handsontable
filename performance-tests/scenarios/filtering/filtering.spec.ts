import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { injectHookTimer, getHookTiming, saveHookTimings } from '../../lib/hook-timing.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot);

  // Inject hook timing for filter measurement
  await injectHookTimer(page, 'beforeFilter', 'afterFilter');

  const hookDeltas: number[] = [];
  const outputDir = path.resolve('output', config.name);

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir,
    actionFn: async() => {
      // Apply a filter on column 0: contains "1"
      await page.evaluate(() => {
        const hot = (window as any).__hot;
        const filtersPlugin = hot.getPlugin('filters');

        filtersPlugin.addCondition(0, 'contains', ['1']);
        filtersPlugin.filter();
      });

      // Capture hook timing
      const timing = await getHookTiming(page, 'beforeFilter', 'afterFilter');

      if (timing.deltaMs != null) {
        hookDeltas.push(timing.deltaMs);
      }
    },
    resetFn: async() => {
      // Clear filters between iterations
      await page.evaluate(() => {
        const hot = (window as any).__hot;
        const filtersPlugin = hot.getPlugin('filters');

        filtersPlugin.clearConditions();
        filtersPlugin.filter();
      });

      // Re-inject hook timer (gets cleared on filter reset)
      await injectHookTimer(page, 'beforeFilter', 'afterFilter');
    },
  });

  // Discard warmup deltas -- actionFn runs during warmup too
  const measuredDeltas = hookDeltas.slice(config.warmupRuns);

  await saveHookTimings(outputDir, measuredDeltas);
});
