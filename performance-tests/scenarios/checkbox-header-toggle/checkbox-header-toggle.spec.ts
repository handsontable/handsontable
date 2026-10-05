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
    // Every cell starts unchecked, so the header reads 'unchecked' and the toggle checks the column.
    actionFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.getPlugin('checkboxHeader').toggleColumn(0);
      });
    },
    // Read back after the window closes -- a CDP round trip. It also fails the run when the toggle
    // wrote nothing, which would otherwise read as a fast toggle.
    afterActionFn: async() => {
      const state = await page.evaluate(() => (window as any).__hot.getPlugin('checkboxHeader')
        .getHeaderCheckboxState(0));

      if (state.state !== 'checked' || state.selected !== 100000) {
        throw new Error(`${config.name}: expected the whole column checked, got ${JSON.stringify(state)}`);
      }
    },
    resetFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.getPlugin('checkboxHeader').setColumnChecked(0, false);
      });
    },
  });
});
