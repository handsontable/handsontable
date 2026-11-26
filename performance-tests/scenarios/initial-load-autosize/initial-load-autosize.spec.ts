import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => typeof (window as any).__build === 'function', undefined, { polling: 100 });

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    // The measured action is the grid construction, including the synchronous part of AutoColumnSize's
    // sweep. The columns it leaves to idle tasks are measured after the window closes.
    actionFn: async() => {
      await page.evaluate(() => (window as any).__build());
    },
    // Destroying the grid cancels the idle part of the sweep, so each measured build starts clean.
    resetFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.destroy();
        (window as any).__hot = null;
      });
    },
  });
});
