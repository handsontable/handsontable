import { test, type Page } from '@playwright/test';
import path from 'node:path';
import { runTracedScenario } from '../../lib/trace-runner.mjs';
import config from './scenario.config.mjs';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.html');

const NARROW = 25;
const WIDE = 320;

/**
 * Resizes column C through the ManualColumnResize plugin and draws, the same path a resize-handle
 * double-click takes. Wide: the wrapped rows 1-40 shrink to two lines and the rendered row band is
 * refilled within that draw. Narrow: the rows grow again, which restores the starting state.
 *
 * @param {Page} page The page the fixture is open on.
 * @param {number} width The new width of column C.
 */
async function resizeColumnC(page: Page, width: number) {
  await page.evaluate((newWidth: number) => {
    const hot = (window as any).__hot;

    hot.getPlugin('manualColumnResize').setManualSize(2, newWidth);
    hot.render();
  }, width);
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
      await resizeColumnC(page, WIDE);
    },
    resetFn: async() => {
      await resizeColumnC(page, NARROW);
    },
  });
});
