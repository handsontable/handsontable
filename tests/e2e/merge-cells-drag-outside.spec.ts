import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { MergeCellsDragOutsidePage } from '../fixtures/pages/MergeCellsDragOutsidePage';

/**
 * Drag-selecting past the edge of the grid maps the pointer to the nearest row and column. The lookup
 * measures a merged cell once per row (or column) it spans, so a pointer that left the grid next to a
 * merged band used to land several rows (or columns) off: the band's whole height was added once per
 * row of the band.
 *
 * The auto-scroll is off in the fixture, so the selection follows the table's own handling of the
 * pointer that is outside the grid.
 *
 * Grid of the fixture: 10 rows and 5 columns, nothing scrolls. The vertical scenario merges column A over
 * rows 3-8 (visual rows 2-7); the horizontal one merges row 1 over columns A-C.
 */
test.describe('drag-selecting out of the grid over a merge', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: MergeCellsDragOutsidePage;

  test.afterEach(async() => {
    await grid?.release();
  });

  test.describe('a vertical merge', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new MergeCellsDragOutsidePage(page, theme, bundle);
      await grid.goto('vertical');
    });

    test('ends the selection on the row beside the pointer, below the merged band', async() => {
      await grid.dragOut({ row: 9, col: 1 }, { side: 'right', row: 8 });

      await expect.poll(() => grid.selected()).toEqual([9, 1, 8, 4]);
    });

    test('ends the selection on the row beside the pointer, inside the merged band', async() => {
      await grid.dragOut({ row: 9, col: 1 }, { side: 'right', row: 5 });

      await expect.poll(() => grid.selected()).toEqual([9, 1, 5, 4]);
    });
  });

  test.describe('a horizontal merge', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new MergeCellsDragOutsidePage(page, theme, bundle);
      await grid.goto('horizontal');
    });

    test('ends the selection on the column beside the pointer, past the merged band', async() => {
      await grid.dragOut({ row: 5, col: 0 }, { side: 'bottom', col: 3 });

      await expect.poll(() => grid.selected()).toEqual([5, 0, 9, 3]);
    });

    test('ends the selection on the column beside the pointer, inside the merged band', async() => {
      await grid.dragOut({ row: 5, col: 0 }, { side: 'bottom', col: 1 });

      await expect.poll(() => grid.selected()).toEqual([5, 0, 9, 1]);
    });
  });
});
