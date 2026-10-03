import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { injectHookTimer, getHookTiming, saveHookTimings } from '../../lib/hook-timing.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');
const ROWS = 100000;

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot, undefined, { polling: 100 });

  const hookDeltas: number[] = [];
  const outputDir = path.resolve('output', config.name);

  // The pair brackets the scope resolution's hand-off to the map write: before* fires once the rows
  // that change are known, after* once the map is written -- the render that follows is outside it.
  await injectHookTimer(page, 'beforeRowSelectionChange', 'afterRowSelectionChange');

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir,
    actionFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.getPlugin('rowSelection').selectAll();
      });
    },
    // Read back after the window closes -- these are CDP round trips. It also fails the run when the
    // call selected nothing, which would otherwise read as a fast select all.
    afterActionFn: async() => {
      const selected = await page.evaluate(() => (window as any).__hot.getPlugin('rowSelection').getSelectedCount());

      if (selected !== ROWS) {
        throw new Error(`${config.name}: expected ${ROWS} selected rows, got ${selected}`);
      }

      const timing = await getHookTiming(page, 'beforeRowSelectionChange', 'afterRowSelectionChange');

      if (timing.deltaMs != null) {
        hookDeltas.push(timing.deltaMs);
      }
    },
    resetFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.getPlugin('rowSelection').deselectAll();
      });

      // After the deselect, which fires the same pair: the store starts empty for the next iteration.
      await injectHookTimer(page, 'beforeRowSelectionChange', 'afterRowSelectionChange');
    },
  });

  await saveHookTimings(outputDir, hookDeltas);
});
