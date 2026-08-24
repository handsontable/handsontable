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
    // The measured action is the grid construction itself, so the trace captures both the scripting
    // (load) time and the JS heap via UpdateCounters events.
    actionFn: async() => {
      await page.evaluate(() => (window as any).__build());
    },
    // Tear the instance down between iterations so each measured build starts from a clean state.
    resetFn: async() => {
      await page.evaluate(() => {
        (window as any).__hot.destroy();
        (window as any).__hot = null;
      });
    },
  });
});
