import { test } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');
// `A99` and `A990` to `A999`, `A9900` to `A9999` and `A99000` to `A99999` in the first column.
const EXPECTED_HITS = 1111;
// The query keeps meta for its matches only, on top of the meta of the rendered cells. Storing a meta
// object per scanned cell would put this at 2,000,000.
const MAX_STORED_META = 20000;

/**
 * Runs the query and keeps only its hit count. A named function declaration, not an inline arrow:
 * script run straight from `page.evaluate` counts as scripting only on a named frame.
 */
function runSearchQuery() {
  const win = window as any;

  win.__hits = win.__hot.getPlugin('search').query('A99').length;
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
      await page.evaluate(runSearchQuery);
    },
    // A query that missed cells would only show up as a faster run, and one that stored meta for
    // every cell would only show up as a slower one.
    afterActionFn: async() => {
      const { hits, storedMeta } = await page.evaluate(() => ({
        hits: (window as any).__hits,
        storedMeta: (window as any).__hot.getCellsMeta().length,
      }));

      if (hits !== EXPECTED_HITS) {
        throw new Error(`${config.name}: ${hits} hits, expected ${EXPECTED_HITS}`);
      }

      if (storedMeta > MAX_STORED_META) {
        throw new Error(`${config.name}: ${storedMeta} stored cell meta objects, expected at most ${MAX_STORED_META}`);
      }
    },
    // Each iteration measures the first query on a fresh grid, not a query over meta an earlier
    // one stored.
    resetFn: async() => {
      await page.evaluate(() => (window as any).__reload());
    },
  });
});
