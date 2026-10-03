import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { scrollToRow } from '../../lib/scroll-utils.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot, undefined, { polling: 100 });

  // The fixture selects every other row; fail here rather than measure a grid with nothing selected.
  const selected = await page.evaluate(() => (window as any).__hot.getPlugin('rowSelection').getSelectedCount());

  if (selected !== 50000) {
    throw new Error(`${config.name}: expected 50000 selected rows, got ${selected}`);
  }

  const holder = page.locator('.ht_master .wtHolder');

  await holder.hover();

  // The same action and reset as scroll-down, so the two compare directly.
  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    actionFn: async() => {
      for (let i = 0; i < 500; i++) {
        await page.mouse.wheel(0, 350);
      }
    },
    resetFn: async() => {
      await scrollToRow(page, 0);
    },
  });
});
