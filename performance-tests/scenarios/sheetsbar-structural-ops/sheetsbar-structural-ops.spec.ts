import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');
// The fixture's row count; keep the two in step.
const ROWS = 10000;

/**
 * One row insert and one removal in the visible sheet, in the page. A named function: a script run
 * straight from `page.evaluate` is billed from CPU samples, which drop an anonymous frame.
 */
function insertAndRemoveRow() {
  const hot = (window as any).__hot;

  hot.alter('insert_row_above', 100, 1);
  hot.alter('remove_row', 100, 1);
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
      await page.evaluate(insertAndRemoveRow);
    },
    // Read back after the window closes -- this is a CDP round trip. An insert and a removal always net
    // to ROWS, so the row count only proves nothing was left behind; the two undo steps (one per call)
    // prove both ran, which would otherwise read as a fast operation.
    afterActionFn: async() => {
      const state = await page.evaluate(() => {
        const hot = (window as any).__hot;

        return {
          rows: hot.countRows(),
          undoSteps: hot.getPlugin('undoRedo').doneActions.length,
        };
      });

      if (state.rows !== ROWS || state.undoSteps !== 2) {
        throw new Error(`${config.name}: rows ${state.rows}, undo steps ${state.undoSteps}`);
      }
    },
    // The undo stack holds both steps; clear it so the heap does not grow from one iteration to the next.
    resetFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.getPlugin('undoRedo').clear();
      });
    },
  });
});
