import type { Page } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { HandsontableEditorListPositionPage, type EditorType } from '../fixtures/pages/HandsontableEditorListPositionPage';

/**
 * A grid in a shrink-to-fit wrapper (`display: inline-block`) on a page the window scrolls is as wide as
 * its table, not as wide as the viewport. In an RTL page the grid root then reaches far past the
 * viewport's left edge, and the left edge is not the grid's inline-start edge. Opening an editor, or
 * selecting a cell that is already visible, must not move the window.
 *
 * The wrapper is added through `page.route`: the fixture's `?wrap=` allowlist only holds a transform, and
 * the fixture is shared with the editor list position spec. The layout is checked before each act, so a
 * route that silently stops matching cannot pass for the block layout, where these cases hold anyway.
 */
const PAGE_SCROLL = 1500;
const POINT_X = 640;
const POINT_Y = 60;

/**
 * Wraps the fixture's grid in an inline-block box.
 *
 * @param {Page} page The page.
 */
async function wrapGridInInlineBlock(page: Page) {
  await page.route('**/handsontable-editor-list-position.html*', async(route) => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace('<div id="grid" data-testid="grid"></div>',
        '<div style="display: inline-block"><div id="grid" data-testid="grid"></div></div>');

    await route.fulfill({ response, body });
  });
}

/**
 * Lets two animation frames pass: a scroll the grid triggers runs on a later frame than the call that
 * asked for it, so a read right after the call would pass on the old code.
 *
 * @param {Page} page The page.
 */
async function settleFrames(page: Page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/**
 * Asserts the layout under test: the grid root is as wide as the table, far wider than the viewport.
 *
 * @param {Page} page The page.
 */
async function expectShrinkWrappedGrid(page: Page) {
  const rootWidth = await page.evaluate(() => (window as any).hot.rootElement.getBoundingClientRect().width);

  expect(rootWidth).toBeGreaterThan(3000);
}

/**
 * Scrolls the window to the inline end by `PAGE_SCROLL` and returns the cell under the fixed point.
 *
 * @param {Page} page The page.
 * @param {'ltr' | 'rtl'} dir The document's direction.
 * @returns {Promise<{ row: number, col: number }>} The cell's coordinates.
 */
async function scrollAndPickCell(page: Page, dir: 'ltr' | 'rtl') {
  const sign = dir === 'rtl' ? -1 : 1;

  await page.evaluate((x) => window.scrollTo(x, 0), sign * PAGE_SCROLL);
  await expect.poll(() => page.evaluate(() => window.scrollX)).toBe(sign * PAGE_SCROLL);

  // Rendered cells follow the scroll, so wait for one under the point.
  await expect.poll(() => page.evaluate(([x, y]) => {
    const td = document.elementFromPoint(x, y)?.closest('td');

    return !!td && (window as any).hot.getCoords(td).col >= 0;
  }, [POINT_X, POINT_Y])).toBe(true);

  return page.evaluate(([x, y]) => {
    const td = document.elementFromPoint(x, y)!.closest('td')!;
    const { row, col } = (window as any).hot.getCoords(td);

    return { row, col };
  }, [POINT_X, POINT_Y]);
}

for (const type of ['multiselect', 'handsontable'] as EditorType[]) {
  test.describe(`RTL page, grid in an inline-block wrapper, ${type} editor`, { tag: ['@core', THEMES_TAG] }, () => {
    let grid: HandsontableEditorListPositionPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      await wrapGridInInlineBlock(page);
      grid = new HandsontableEditorListPositionPage(page, theme, bundle, { dir: 'rtl', layout: 'window', type });
      await grid.goto();

      await expectShrinkWrappedGrid(page);
    });

    test('should not move the window when Enter opens the editor', async({ page }) => {
      const { row, col } = await scrollAndPickCell(page, 'rtl');

      await page.evaluate(([r, c]) => (window as any).hot.selectCell(r, c, r, c, false), [row, col]);
      await expect.poll(() => page.evaluate(() => window.scrollX)).toBe(-PAGE_SCROLL);

      await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => (window as any).hot.getActiveEditor().isOpened())).toBe(true);
      await settleFrames(page);

      expect(await page.evaluate(() => window.scrollX)).toBe(-PAGE_SCROLL);

      const cell = await page.evaluate(([r, c]) => {
        const rect = (window as any).hot.getCell(r, c).getBoundingClientRect();

        return { left: rect.left, right: rect.right, width: document.documentElement.clientWidth };
      }, [row, col]);

      expect(cell.left).toBeGreaterThanOrEqual(0);
      expect(cell.right).toBeLessThanOrEqual(cell.width);
    });

    test('should not move the window when selecting a cell that is already visible', async({ page }) => {
      const { row, col } = await scrollAndPickCell(page, 'rtl');

      await page.evaluate(([r, c]) => (window as any).hot.selectCell(r, c), [row, col]);
      await settleFrames(page);

      expect(await page.evaluate(() => window.scrollX)).toBe(-PAGE_SCROLL);
    });
  });
}

test.describe('RTL page, grid started 600 px from the page inline-start edge', { tag: ['@core', THEMES_TAG] }, () => {
  test('should not move the window when Enter opens the editor', async({ page, theme, bundle }) => {
    const grid = new HandsontableEditorListPositionPage(page, theme, bundle, {
      dir: 'rtl', layout: 'window', type: 'multiselect', inset: 'start',
    });

    await grid.goto();

    // The grid starts 600 px from the page's right edge, so its root is narrower than the viewport.
    const rootWidth = await page.evaluate(() => (window as any).hot.rootElement.getBoundingClientRect().width);

    expect(rootWidth).toBeLessThan(1280);

    const { row, col } = await scrollAndPickCell(page, 'rtl');

    await page.evaluate(([r, c]) => (window as any).hot.selectCell(r, c, r, c, false), [row, col]);
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => (window as any).hot.getActiveEditor().isOpened())).toBe(true);
    await settleFrames(page);

    expect(await page.evaluate(() => window.scrollX)).toBe(-PAGE_SCROLL);
  });
});

test.describe('LTR page, grid in an inline-block wrapper', { tag: ['@core', THEMES_TAG] }, () => {
  test('should not move the window when Enter opens the editor', async({ page, theme, bundle }) => {
    await wrapGridInInlineBlock(page);

    const grid = new HandsontableEditorListPositionPage(page, theme, bundle, {
      dir: 'ltr', layout: 'window', type: 'multiselect',
    });

    await grid.goto();
    await expectShrinkWrappedGrid(page);

    const { row, col } = await scrollAndPickCell(page, 'ltr');

    await page.evaluate(([r, c]) => (window as any).hot.selectCell(r, c, r, c, false), [row, col]);
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => (window as any).hot.getActiveEditor().isOpened())).toBe(true);
    await settleFrames(page);

    expect(await page.evaluate(() => window.scrollX)).toBe(PAGE_SCROLL);
  });
});
