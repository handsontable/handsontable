import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { injectHookTimer, getHookTiming, saveHookTimings } from '../../lib/hook-timing.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot, undefined, { polling: 100 });

  const hookDeltas: number[] = [];
  const outputDir = path.resolve('output', config.name);

  const selectEveryRow = async() => {
    await page.evaluate(() => {
      (window as any).__hot.getPlugin('rowSelection').selectAll();
    });

    // After the select, which fires the same pair: the store starts empty for the next iteration.
    await injectHookTimer(page, 'beforeRowSelectionChange', 'afterRowSelectionChange');
  };

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir,
    setupFn: selectEveryRow,
    actionFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.getPlugin('rowSelection').deselectAll();
      });
    },
    // Read back after the window closes -- these are CDP round trips. It also fails the run when the
    // call cleared nothing, which would otherwise read as a fast deselect all.
    afterActionFn: async() => {
      const selected = await page.evaluate(() => (window as any).__hot.getPlugin('rowSelection').getSelectedCount());

      if (selected !== 0) {
        throw new Error(`${config.name}: expected no selected rows, got ${selected}`);
      }

      const timing = await getHookTiming(page, 'beforeRowSelectionChange', 'afterRowSelectionChange');

      if (timing.deltaMs != null) {
        hookDeltas.push(timing.deltaMs);
      }
    },
    resetFn: selectEveryRow,
  });

  await saveHookTimings(outputDir, hookDeltas);
});
