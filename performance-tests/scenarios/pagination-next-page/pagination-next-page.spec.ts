import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

// One page change takes tens of milliseconds, so the window holds twenty of them.
const PAGE_CHANGES = 20;

test(config.name, async({ page }) => {
  await page.goto(`file://${fixturePath}`);
  await page.waitForFunction(() => (window as any).__hot, undefined, { polling: 100 });

  await runTracedScenario({
    page,
    warmupRuns: config.warmupRuns,
    iterations: config.iterations,
    outputDir: path.resolve('output', config.name),
    actionFn: async() => {
      await page.evaluate(count => (window as any).__nextPages(count), PAGE_CHANGES);
    },
    // Every iteration pages forward from the first page, with an empty undo stack: each page change
    // records an undo step, and a stack that grows across iterations would change what they measure.
    resetFn: async() => {
      await page.evaluate(() => {
        const hot = (window as any).__hot;

        hot.getPlugin('pagination').setPage(1);
        hot.getPlugin('undoRedo').clear();
      });
    },
  });
});
