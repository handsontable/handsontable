import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot, undefined, { polling: 100 });

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    // The change lists are built once, outside every window: checkbox-header-toggle builds its list
    // inside the plugin, but that scan is the plugin cost this baseline exists to separate out.
    setupFn: async() => {
      await page.evaluate(() => {
        const hot = (window as any).__hot;
        const rows = hot.countRows();
        const check = new Array(rows);
        const uncheck = new Array(rows);

        for (let row = 0; row < rows; row++) {
          check[row] = [row, 0, true];
          uncheck[row] = [row, 0, false];
        }

        (window as any).__checkChanges = check;
        (window as any).__uncheckChanges = uncheck;
      });
    },
    actionFn: async() => {
      await page.evaluate(() => {
        const hot = (window as any).__hot;

        // The source checkbox-header-toggle writes under, so both runs take the same hook paths.
        hot.setDataAtCell((window as any).__checkChanges, 'CheckboxHeader.toggle');
      });
    },
    // Read back after the window closes -- a CDP round trip. It also fails the run when nothing was
    // written.
    afterActionFn: async() => {
      const checked = await page.evaluate(() => (window as any).__hot.getDataAtCol(0)
        .filter((value: unknown) => value === true).length);

      if (checked !== 100000) {
        throw new Error(`${config.name}: expected 100000 checked cells, got ${checked}`);
      }
    },
    resetFn: async() => {
      await page.evaluate(() => {
        const hot = (window as any).__hot;

        hot.setDataAtCell((window as any).__uncheckChanges, 'CheckboxHeader.toggle');
      });
    },
  });
});
