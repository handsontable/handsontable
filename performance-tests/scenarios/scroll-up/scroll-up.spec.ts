import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import { scrollToRow } from '../../lib/scroll-utils.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot);

  // Scroll to bottom first (pre-trace setup)
  await scrollToRow(page, 4999);

  const holder = page.locator('.ht_master .wtHolder');

  await holder.hover();

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    actionFn: async() => {
      for (let i = 0; i < 500; i++) {
        await page.mouse.wheel(0, -350);
      }
    },
    resetFn: async() => {
      await scrollToRow(page, 9999);
    },
  });
});
