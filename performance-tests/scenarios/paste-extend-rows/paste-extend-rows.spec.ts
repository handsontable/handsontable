import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { injectHookTimer, getHookTiming, saveHookTimings } from '../../lib/hook-timing.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

/**
 * Pastes the prepared clipboard text on the selected last row. A named function declaration, not an
 * inline arrow: script run straight from `page.evaluate` counts as scripting only on a named frame.
 */
function pasteClipboardBlock() {
  const win = window as any;

  win.__hot.getPlugin('copyPaste').paste(win.__pasteText, '');
}

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot, undefined, { polling: 100 });

  const hookDeltas: number[] = [];
  const outputDir = path.resolve('output', config.name);

  // The paste starts on the last row, so all but one of the pasted rows are created by the paste.
  const selectLastRow = async() => {
    await page.evaluate(() => {
      const hot = (window as any).__hot;

      hot.selectCell(hot.countRows() - 1, 0);
    });
  };

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir,
    setupFn: async() => {
      await selectLastRow();
      await injectHookTimer(page, 'beforePaste', 'afterPaste');
    },
    actionFn: async() => {
      await page.evaluate(pasteClipboardBlock);
    },
    // Read back after the window closes -- this is a CDP round trip. It also fails the run when the
    // paste wrote nothing or did not grow the grid, which would otherwise read as a fast paste.
    afterActionFn: async() => {
      const result = await page.evaluate(() => {
        const win = window as any;
        const hot = win.__hot;

        return {
          rows: hot.countRows(),
          expectedRows: win.__gridRows - 1 + win.__pasteRows,
          lastCell: hot.getDataAtCell(hot.countRows() - 1, win.__gridCols - 1),
          expectedLastCell: `P${win.__pasteRows - 1}-${win.__gridCols - 1}`,
        };
      });

      if (result.rows !== result.expectedRows || result.lastCell !== result.expectedLastCell) {
        throw new Error(`${config.name}: the paste did not extend the grid as expected (${JSON.stringify(result)})`);
      }

      const timing = await getHookTiming(page, 'beforePaste', 'afterPaste');

      if (timing.deltaMs != null) {
        hookDeltas.push(timing.deltaMs);
      }
    },
    resetFn: async() => {
      await page.evaluate(() => {
        const win = window as any;

        win.__hot.loadData(win.Handsontable.helper.createSpreadsheetData(win.__gridRows, win.__gridCols));
      });
      await page.waitForFunction(() => {
        const win = window as any;

        return win.__hot.countRows() === win.__gridRows;
      }, undefined, { polling: 100 });
      await selectLastRow();
      await injectHookTimer(page, 'beforePaste', 'afterPaste');
    },
  });

  await saveHookTimings(outputDir, hookDeltas);
});
