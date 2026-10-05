import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * A merged cell that crosses the `fixedRowsBottom` line is rendered by the master (its origin) and by
 * the bottom clone (the rows below the line). The bottom clone never holds the origin, so every
 * covered cell in it used to be hidden and the rest of the row slid one column to the inline start,
 * under the wrong header (DEV-176).
 */
test.describe('merged cell across the fixedRowsBottom line', () => {
  let grid: SelectionFeaturesPage;

  // The fixture has 10 rows, so `fixedRowsBottom: 2` freezes rows 8 and 9.
  const BLOCK_ACROSS_BOTTOM_LINE = { row: 6, col: 1, rowspan: 4, colspan: 1 };
  const FROZEN_ROWS = [8, 9];

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  for (const [name, mergeCells] of [
    ['default', [BLOCK_ACROSS_BOTTOM_LINE]],
    ['virtualized', { virtualized: true, cells: [BLOCK_ACROSS_BOTTOM_LINE] }],
  ] as const) {
    test(`keeps the frozen bottom rows under their own headers (${name})`, async () => {
      await grid.initGrid({ fixedRowsBottom: 2, mergeCells });

      for (const row of FROZEN_ROWS) {
        for (const col of [0, 2, 3]) {
          await expect.poll(() => grid.cellOffsetFromColumnHeader('bottom', row, col)).toBe(0);
        }
      }
    });

    test(`draws one outline and one fill handle for the selected block (${name})`, async () => {
      await grid.initGrid({ fixedRowsBottom: 2, mergeCells });
      await grid.selectCells(6, 1, 6, 1);

      const { row, col, rowspan } = BLOCK_ACROSS_BOTTOM_LINE;

      await expect.poll(async () => (await grid.mergedBlockSelection(row, col)).fillHandles.length).toBe(1);

      const { edgesInside, outline, fillHandles } = await grid.mergedBlockSelection(row, col);

      // No edge on the freeze line, an outline on every track of every side, and the fill handle on the
      // block's bottom-end corner, which only the bottom clone renders.
      expect(edgesInside).toEqual([]);
      expect(outline).toEqual({
        top: [true],
        bottom: [true],
        left: Array(rowspan).fill(true),
        right: Array(rowspan).fill(true),
      });
      expect(fillHandles[0].overlay).toBe('ht_clone_bottom');
    });

    for (const hiddenRow of [3, 7]) {
      test(`keeps the frozen bottom rows under their own headers with row ${hiddenRow} hidden (${name})`, async () => {
        // Row 3 sits above the block and row 7 inside it, so the visual and renderable indexes differ.
        await grid.initGrid({ fixedRowsBottom: 2, mergeCells, hiddenRows: { rows: [hiddenRow], indicators: false } });

        for (const row of FROZEN_ROWS) {
          for (const col of [0, 2, 3]) {
            await expect.poll(() => grid.cellOffsetFromColumnHeader('bottom', row, col)).toBe(0);
          }
        }
      });
    }

    test(`keeps the frozen bottom rows under their own headers with a frozen column (${name})`, async () => {
      await grid.initGrid({ fixedRowsBottom: 2, fixedColumnsStart: 1, mergeCells });

      for (const row of FROZEN_ROWS) {
        for (const col of [2, 3]) {
          await expect.poll(() => grid.cellOffsetFromColumnHeader('bottom', row, col)).toBe(0);
        }
      }
    });
  }
});
