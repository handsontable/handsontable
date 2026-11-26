import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');
const ROWS = 100000;
const COLUMNS = 100;

/**
 * Reads the whole grid and keeps only its shape, so the 10M-cell result is not serialized inside the
 * window. A named function declaration, not an inline arrow: script run straight from `page.evaluate`
 * counts as scripting only on a named frame.
 */
function readAllData() {
  const win = window as any;
  const data = win.__hot.getData();

  win.__readShape = { rows: data.length, columns: data[0]?.length ?? 0 };
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
      await page.evaluate(readAllData);
    },
    // A read that returned less than the whole grid would only show up as a faster run.
    afterActionFn: async() => {
      const shape = await page.evaluate(() => (window as any).__readShape);

      if (shape?.rows !== ROWS || shape?.columns !== COLUMNS) {
        throw new Error(`${config.name}: read ${JSON.stringify(shape)}, expected ${ROWS} x ${COLUMNS}`);
      }
    },
  });
});
