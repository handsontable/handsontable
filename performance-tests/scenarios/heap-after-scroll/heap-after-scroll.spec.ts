import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { scrollToRow } from '../../lib/scroll-utils.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot);

  const holder = page.locator('.ht_master .wtHolder');

  await holder.hover();

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    // 700 wheel steps x 350px (~245000px) covers the full ~230000px grid height, so every row is
    // rendered during the scroll and the UpdateCounters JS-heap max reflects the retained memory.
    actionFn: async() => {
      for (let i = 0; i < 700; i++) {
        await page.mouse.wheel(0, 350);
      }
    },
    // Scroll back to the top before the next iteration.
    resetFn: async() => {
      await scrollToRow(page, 0);
    },
  });
});
