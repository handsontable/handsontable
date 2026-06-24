import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => typeof (window as any).__build === 'function');

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    // Trace the grid construction so the scripting (load) time captures source-data validation across
    // all cells, and UpdateCounters captures the JS heap it retains.
    actionFn: async() => {
      await page.evaluate(() => (window as any).__build());
    },
    resetFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.destroy();
        (window as any).__hot = null;
      });
    },
  });
});
