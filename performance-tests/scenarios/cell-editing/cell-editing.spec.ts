import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');
const CELLS_TO_EDIT = 20;

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot);

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    actionFn: async() => {
      for (let row = 0; row < CELLS_TO_EDIT; row++) {
        // Select cell programmatically then open editor
        await page.evaluate((r) => {
          const hot = (window as any).__hot;

          hot.selectCell(r, 0);
        }, row);

        // Open editor via Enter key
        await page.keyboard.press('Enter');

        // Type new value
        await page.keyboard.type(`edited-${row}`, { delay: 10 });

        // Confirm with Enter
        await page.keyboard.press('Enter');
      }
    },
    resetFn: async() => {
      // Reset data between iterations
      await page.evaluate(() => {
        const hot = (window as any).__hot;

        hot.loadData((window as any).Handsontable.helper.createSpreadsheetData(5000, 10));
      });
      await page.waitForFunction(() => {
        const hot = (window as any).__hot;

        return hot.countRenderedRows() > 0;
      });
    },
  });
});
