import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');
const CALLS = 5000;

/**
 * Sets one meta key on `calls` cells, row by row, one undo step per call. A named function: script run
 * straight from `page.evaluate` is billed from CPU samples, and a sample whose frame has no name is
 * dropped.
 *
 * @param {number} calls How many cells to mark.
 */
function setCellMetaLoop(calls: number) {
  const hot = (window as any).__hot;
  const columns = hot.countCols();

  for (let index = 0; index < calls; index++) {
    hot.setCellMeta(Math.floor(index / columns), index % columns, 'className', 'marked');
  }
}

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot, undefined, { polling: 100 });

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    actionFn: async() => {
      await page.evaluate(setCellMetaLoop, CALLS);
    },
    // Read back after the window closes -- a CDP round trip. It also fails the run when the calls were
    // not recorded one step each, which would otherwise read as a fast loop.
    afterActionFn: async() => {
      const steps = await page.evaluate(() => (window as any).__hot.getPlugin('undoRedo').doneActions.length);

      if (steps !== CALLS) {
        throw new Error(`${config.name}: expected ${CALLS} undo steps, got ${steps}`);
      }
    },
    // The same 5000 steps on an empty stack in every window: a stack that grows across iterations
    // would measure each one on a longer history.
    resetFn: async() => {
      await page.evaluate(() => {
        const hot = (window as any).__hot;

        hot.batch(() => {
          for (let row = 0; row < 100; row++) {
            for (let column = 0; column < hot.countCols(); column++) {
              hot.removeCellMeta(row, column, 'className');
            }
          }
        });
        hot.getPlugin('undoRedo').clear();
      });
    },
  });
});
