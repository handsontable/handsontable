import { test, expect, CROSS_BROWSER_TAG, THEMES_TAG } from '../fixtures/test';
import { ManualRowMoveNoColumnsPage } from '../fixtures/pages/ManualRowMoveNoColumnsPage';

/**
 * Moving a row by its header while every column is hidden. The rows can still be moved through their
 * headers, so the drop guideline stays on them, but there is no cell to back-light: the backlight used to
 * keep the full width of the table's hider and was drawn past the right edge of the grid, right of the
 * row headers, as a grey box.
 */
test.describe('moving a row by its header while columns are hidden', { tag: [CROSS_BROWSER_TAG, THEMES_TAG] }, () => {
  let grid: ManualRowMoveNoColumnsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ManualRowMoveNoColumnsPage(page, theme, bundle);
    await grid.goto();
  });

  test('draws no backlight outside the grid when every column is hidden', async() => {
    await grid.hideColumns();
    await grid.dragRowHeaderToLowerHalfOf(1, 2);

    const { hider, backlight, guideline, renderedColumns } = await grid.geometry();

    // The precondition: nothing but the row headers is drawn.
    expect(renderedColumns).toBe(0);
    expect(backlight.width).toBe(0);
    // Whatever the width, nothing of the move UI reaches past the grid.
    expect(backlight.right).toBeLessThanOrEqual(hider.right + 0.5);
    expect(guideline.left).toBeGreaterThanOrEqual(hider.left - 0.5);
    expect(guideline.right).toBeLessThanOrEqual(hider.right + 0.5);

    await grid.release();
  });

  test('still moves the row through its header when every column is hidden', async() => {
    await grid.hideColumns();
    await grid.dragRowHeaderToLowerHalfOf(1, 2);
    await grid.release();

    expect(await grid.physicalRows(4)).toEqual([0, 2, 1, 3]);
  });

  test('keeps the backlight over the cells when a column is visible', async() => {
    await grid.hideColumns(2);
    await grid.dragRowHeaderToLowerHalfOf(1, 2);

    const { hider, backlight, renderedColumns } = await grid.geometry();

    expect(renderedColumns).toBe(1);
    expect(backlight.width).toBeGreaterThan(0);
    expect(backlight.right).toBeLessThanOrEqual(hider.right + 0.5);

    await grid.release();
  });
});
