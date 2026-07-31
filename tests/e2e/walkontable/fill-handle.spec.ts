import { test, expect } from '../../fixtures/test';
import { FillHandlePage } from '../../fixtures/pages/FillHandlePage';

/**
 * The fill handle of the cell at the far edge of the grid is pulled back inside
 * the viewport, so it never enlarges the scrollable area. With frozen panes the
 * master table is shifted by the frozen pane, and missing that shift made the
 * handle hang past the last column/row and grow a scrollbar on the master table
 * alone (#13143).
 */
test.describe('fill handle at the grid edge', { tag: '@walkontable' }, () => {
  let grid: FillHandlePage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new FillHandlePage(page, theme);
    await grid.goto();
    await grid.scrollToEnd();
  });

  test('selecting the last column does not widen the scrollable area', async () => {
    const { width } = await grid.scrollSize();

    await grid.selectCell(grid.lastRow - 1, grid.lastColumn);

    await expect.poll(async () => (await grid.scrollSize()).width).toBe(width);
  });

  test('selecting the last row does not heighten the scrollable area', async () => {
    const { height } = await grid.scrollSize();

    await grid.selectCell(grid.lastRow, grid.lastColumn - 1);

    await expect.poll(async () => (await grid.scrollSize()).height).toBe(height);
  });
});
