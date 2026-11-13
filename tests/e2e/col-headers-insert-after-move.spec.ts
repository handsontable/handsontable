import { test, expect } from '../fixtures/test';
import { ColHeadersInsertAfterMovePage } from '../fixtures/pages/ColHeadersInsertAfterMovePage';

/**
 * An array `colHeaders` is read by the physical column index, so an insert or a removal has to change the array
 * at the physical index too. After a column move the two indexes differ, and the headers drifted off their
 * columns.
 */
test.describe('array colHeaders after a column move', () => {
  let grid: ColHeadersInsertAfterMovePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ColHeadersInsertAfterMovePage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the headers on their columns when a column is inserted to the right of a moved column', async () => {
    // visual order becomes [B, C, D, A]
    await grid.moveColumn(0, 3);
    await expect(grid.headers()).toHaveText(['B', 'C', 'D', 'A']);

    await grid.pickContextMenuItem(0, 3, 'Insert column right');

    // The new column has no entry in the array, so it shows the spreadsheet label of its position.
    await expect(grid.headers()).toHaveText(['B', 'C', 'D', 'A', 'E']);
    await expect(grid.cell(0, 3)).toHaveText('A1');
    await expect(grid.cell(0, 4)).toHaveText('');
  });
});
