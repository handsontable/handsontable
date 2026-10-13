import { test, expect } from '../fixtures/test';
import { ColumnWidthEqualsGridWidthPage } from '../fixtures/pages/ColumnWidthEqualsGridWidthPage';

/**
 * DEV-270. A column `width` that equals the grid `width` was discarded and the column collapsed to
 * the 50px default. The column width is its own setting and must be honored whatever the grid width.
 */
test.describe('column width equal to the grid width', () => {
  let grid: ColumnWidthEqualsGridWidthPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ColumnWidthEqualsGridWidthPage(page, theme, bundle);
    await grid.goto();
  });

  test('renders the column at the configured width instead of the default width', async () => {
    // The border compensation differs between themes.
    expect(Math.abs((await grid.cellWidth(0, 0)) - 300)).toBeLessThanOrEqual(2);
  });
});
