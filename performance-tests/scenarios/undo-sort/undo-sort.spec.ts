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

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir,
    // The step every iteration undoes: a sort of column 0. It is recorded once; each reset redoes it.
    setupFn: async() => {
      await page.evaluate(() => {
        const hot = (window as any).__hot;

        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      });

      await injectHookTimer(page, 'beforeUndo', 'afterUndo');
    },
    actionFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.getPlugin('undoRedo').undo();
      });
    },
    // Read back after the window closes -- this is a CDP round trip. It also fails the run when the
    // undo did nothing, which would otherwise read as a fast undo.
    afterActionFn: async() => {
      const undone = await page.evaluate(() => (window as any).__hot.getPlugin('undoRedo').isRedoAvailable());

      if (!undone) {
        throw new Error(`${config.name}: the undo did not run`);
      }

      const timing = await getHookTiming(page, 'beforeUndo', 'afterUndo');

      if (timing.deltaMs != null) {
        hookDeltas.push(timing.deltaMs);
      }
    },
    resetFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.getPlugin('undoRedo').redo();
      });

      await injectHookTimer(page, 'beforeUndo', 'afterUndo');
    },
  });

  await saveHookTimings(outputDir, hookDeltas);
});
