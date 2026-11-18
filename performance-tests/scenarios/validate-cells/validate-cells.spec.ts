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
    // Waits for the `validateCells()` callback, so the window holds every queued validator and the
    // microtasks that settle them, not only the synchronous pass that queues them.
    actionFn: async() => {
      await page.evaluate(() => (window as any).__validateAll());
    },
    // A fresh grid per iteration: validation leaves `valid` flags in the cell meta.
    resetFn: async() => {
      await page.evaluate(() => (window as any).__build());
    },
  });
});
