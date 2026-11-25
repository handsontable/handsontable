import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { TabMovesVerticalPage } from '../fixtures/pages/TabMovesVerticalPage';

const VERTICAL_TAB = { tabMoves: { row: 1, col: 0 } };
const LAST_ROW = 7;
const LAST_COLUMN = 4;

/**
 * With `tabMoves: { row: 1, col: 0 }` Tab walks down a column, so a press past the last row wraps a
 * column (`beforeColumnWrap`), not a row. Tab must still leave the grid there, the way it does at the
 * end of a row with the default `tabMoves`, or a keyboard user cannot get out (WCAG 2.1.2). The grid
 * is the configuration of the ARIA grid recipe: 8 x 5, both headers, both auto-wrap options off.
 */
test.describe('Tab out of a grid that moves down on Tab', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: TabMovesVerticalPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new TabMovesVerticalPage(page, theme, bundle);
  });

  test('Tab walks down the first column and leaves the grid after the last row', async() => {
    await grid.goto(VERTICAL_TAB);
    await grid.beforeInput.focus();
    await grid.press('Tab');

    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    for (let row = 1; row <= LAST_ROW; row++) {
      // eslint-disable-next-line no-await-in-loop
      await grid.press('Tab');
      // eslint-disable-next-line no-await-in-loop
      await expect.poll(() => grid.selected()).toEqual([[row, 0, row, 0]]);
    }

    await expect(grid.cell(LAST_ROW, 0)).toBeFocused();

    await grid.press('Tab');

    await expect(grid.afterInput).toBeFocused();
    await expect.poll(() => grid.selected()).toBeUndefined();
  });

  test('Tab from the last cell leaves the grid', async() => {
    await grid.goto(VERTICAL_TAB);
    await grid.beforeInput.focus();
    await grid.press('Tab');
    await grid.press('ControlOrMeta+End');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, LAST_COLUMN, LAST_ROW, LAST_COLUMN]]);

    await grid.press('Tab');

    await expect(grid.afterInput).toBeFocused();
    await expect.poll(() => grid.selected()).toBeUndefined();
  });

  test('Shift+Tab from the first cell leaves the grid backward', async() => {
    await grid.goto(VERTICAL_TAB);
    await grid.afterInput.focus();
    await grid.press('Shift+Tab');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, LAST_COLUMN, LAST_ROW, LAST_COLUMN]]);

    await grid.press('ControlOrMeta+Home');

    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.press('Shift+Tab');

    await expect(grid.beforeInput).toBeFocused();
    await expect.poll(() => grid.selected()).toBeUndefined();
  });

  test('with autoWrapCol, Tab from the last cell leaves the grid', async() => {
    await grid.goto({ ...VERTICAL_TAB, autoWrapCol: true });
    await grid.beforeInput.focus();
    await grid.press('Tab');
    await grid.press('ControlOrMeta+End');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, LAST_COLUMN, LAST_ROW, LAST_COLUMN]]);

    await grid.press('Tab');

    await expect(grid.afterInput).toBeFocused();
    await expect.poll(() => grid.selected()).toBeUndefined();
  });

  test('with autoWrapCol, Tab from the last row of another column wraps to the next column', async() => {
    await grid.goto({ ...VERTICAL_TAB, autoWrapCol: true });
    await grid.beforeInput.focus();
    await grid.press('Tab');
    await grid.press('ControlOrMeta+ArrowDown');
    await grid.press('ArrowRight');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, 1, LAST_ROW, 1]]);

    await grid.press('Tab');

    await expect.poll(() => grid.selected()).toEqual([[0, 2, 0, 2]]);
    await expect(grid.cell(0, 2)).toBeFocused();
  });

  test('with autoWrapCol, Shift+Tab from the first cell leaves the grid backward', async() => {
    await grid.goto({ ...VERTICAL_TAB, autoWrapCol: true });
    await grid.afterInput.focus();
    await grid.press('Shift+Tab');
    await grid.press('ControlOrMeta+Home');

    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.press('Shift+Tab');

    await expect(grid.beforeInput).toBeFocused();
    await expect.poll(() => grid.selected()).toBeUndefined();
  });

  test('a beforeColumnWrap listener that adds a row keeps Tab in the grid', async() => {
    await grid.goto({ ...VERTICAL_TAB, minSpareRows: 1 }, { interruptColumnWrap: true });
    await grid.beforeInput.focus();
    await grid.press('Tab');
    await grid.press('ControlOrMeta+ArrowDown');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW + 1, 0, LAST_ROW + 1, 0]]);

    await grid.press('Tab');

    await expect.poll(() => grid.countRows()).toBe(LAST_ROW + 3);
    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW + 2, 0, LAST_ROW + 2, 0]]);
    await expect(grid.cell(LAST_ROW + 2, 0)).toBeFocused();
  });

  test('with autoWrapCol, a beforeColumnWrap listener that adds a row keeps Tab from the last cell in the grid',
    async() => {
      await grid.goto({ ...VERTICAL_TAB, autoWrapCol: true, minSpareRows: 1 }, { interruptColumnWrap: true });
      await grid.beforeInput.focus();
      await grid.press('Tab');
      await grid.press('ControlOrMeta+End');

      await expect.poll(() => grid.selected()).toEqual([[LAST_ROW + 1, LAST_COLUMN, LAST_ROW + 1, LAST_COLUMN]]);

      await grid.press('Tab');

      await expect.poll(() => grid.countRows()).toBe(LAST_ROW + 3);
      await expect.poll(() => grid.selected()).toEqual([[LAST_ROW + 2, LAST_COLUMN, LAST_ROW + 2, LAST_COLUMN]]);
      await expect(grid.cell(LAST_ROW + 2, LAST_COLUMN)).toBeFocused();
    });

  test('with a diagonal tabMoves, Tab from the last row keeps its step to the next column', async() => {
    await grid.goto({ tabMoves: { row: 1, col: 1 } });
    await grid.beforeInput.focus();
    await grid.press('Tab');
    await grid.press('ControlOrMeta+ArrowDown');
    await grid.press('ArrowRight');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, 1, LAST_ROW, 1]]);

    await grid.press('Tab');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, 2, LAST_ROW, 2]]);
    await expect(grid.cell(LAST_ROW, 2)).toBeFocused();
  });

  test('with tabMoves as a function, Tab from the last cell leaves the grid', async() => {
    await grid.goto({}, { verticalTabMovesFunction: true });
    await grid.beforeInput.focus();
    await grid.press('Tab');
    await grid.press('ControlOrMeta+End');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, LAST_COLUMN, LAST_ROW, LAST_COLUMN]]);

    await grid.press('Tab');

    await expect(grid.afterInput).toBeFocused();
    await expect.poll(() => grid.selected()).toBeUndefined();
  });

  test('with the default tabMoves, Tab from the last cell leaves the grid', async() => {
    await grid.goto({});
    await grid.beforeInput.focus();
    await grid.press('Tab');
    await grid.press('ControlOrMeta+End');

    await expect.poll(() => grid.selected()).toEqual([[LAST_ROW, LAST_COLUMN, LAST_ROW, LAST_COLUMN]]);

    await grid.press('Tab');

    await expect(grid.afterInput).toBeFocused();
    await expect.poll(() => grid.selected()).toBeUndefined();
  });
});
