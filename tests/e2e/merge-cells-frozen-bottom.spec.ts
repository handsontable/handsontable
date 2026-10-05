import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * A merged cell that crosses the `fixedRowsBottom` line is rendered by the master (its origin) and by
 * the bottom clone (the rows below the line). The bottom clone never holds the origin, so every
 * covered cell in it used to be hidden and the rest of the row slid one column to the inline start,
 * under the wrong header (DEV-176). The clone's first row now carries the span, empty: the master draws
 * the block's content.
 */
test.describe('merged cell across the fixedRowsBottom line', () => {
  let grid: SelectionFeaturesPage;

  // The fixture has 10 rows, so `fixedRowsBottom: 2` freezes rows 8 and 9.
  const BLOCK_ACROSS_BOTTOM_LINE = { row: 6, col: 1, rowspan: 4, colspan: 1 };
  const BLOCK_IN_FIRST_COLUMN = { row: 6, col: 0, rowspan: 4, colspan: 1 };
  const FROZEN_ROWS = [8, 9];

  /**
   * The `mergeCells` setting for a block, in the given mode.
   *
   * @param {string} mode The `mergeCells` form: the array of areas or the `virtualized` object.
   * @param {object} block The merged area.
   * @returns {object}
   */
  function mergeCellsFor(mode: string, block: typeof BLOCK_ACROSS_BOTTOM_LINE) {
    return mode === 'virtualized' ? { virtualized: true, cells: [block] } : [block];
  }

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  for (const mode of ['default', 'virtualized']) {
    test.describe(mode, () => {
      const mergeCells = mergeCellsFor(mode, BLOCK_ACROSS_BOTTOM_LINE);

      test('keeps the frozen bottom rows under their own headers', async () => {
        await grid.initGrid({ fixedRowsBottom: 2, mergeCells });

        for (const row of FROZEN_ROWS) {
          for (const col of [0, 2, 3]) {
            await expect.poll(() => grid.cellOffsetFromColumnHeader('bottom', row, col)).toBe(0);
          }
        }
      });

      test('carries the span on the first frozen row and leaves its content to the master', async () => {
        await grid.initGrid({ fixedRowsBottom: 2, mergeCells });

        await expect.poll(() => grid.overlayCellState('bottom', 8, 1))
          .toEqual({ displayed: true, rowspan: '2', text: '', className: expect.any(String) });
        expect((await grid.overlayCellState('bottom', 9, 1))?.displayed).toBe(false);
        expect((await grid.overlayCellState('master', 6, 1))?.text).toBe('R7C2');
        // Asked outside any draw, the clone's lookup finds the cell that stands for the block.
        expect(await grid.topmostCellResolves(8, 1)).toBe(true);
      });

      test('draws one outline and one fill handle for the selected block', async () => {
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

      test('hands a real cell to the mouse hooks when the outline of the clone is pressed', async () => {
        await grid.initGrid({ fixedRowsBottom: 2, mergeCells });
        await grid.selectCells(6, 1, 6, 1);

        await expect(grid.page.locator('.ht_clone_bottom .wtBorder.current:visible').first()).toBeVisible();
        expect(await grid.pressOutlineOf('bottom')).toBe('element');
      });

      test('marks the span cell of the clone as selected when an area covers the whole block', async () => {
        await grid.initGrid({ fixedRowsBottom: 2, mergeCells });
        await grid.selectCells(5, 0, 9, 3);

        await expect.poll(async () => (await grid.overlayCellState('bottom', 8, 1))?.className)
          .toMatch(/fullySelectedMergedCell/);
        expect((await grid.overlayCellState('master', 6, 1))?.className).toMatch(/fullySelectedMergedCell/);
      });

      for (const hiddenRow of [3, 7]) {
        test(`keeps the frozen bottom rows under their own headers with row ${hiddenRow} hidden`, async () => {
          // Row 3 sits above the block and row 7 inside it, so the visual and renderable indexes differ.
          await grid.initGrid({ fixedRowsBottom: 2, mergeCells, hiddenRows: { rows: [hiddenRow], indicators: false } });

          for (const row of FROZEN_ROWS) {
            for (const col of [0, 2, 3]) {
              await expect.poll(() => grid.cellOffsetFromColumnHeader('bottom', row, col)).toBe(0);
            }
          }
        });
      }

      test('does not let a long text in the block grow the rows of the clone', async () => {
        const data = Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (__, c) => `R${r + 1}C${c + 1}`));

        data[6][1] = 'A long text that wraps over many lines in a narrow column '.repeat(8);
        await grid.initGrid({ data, fixedRowsBottom: 2, mergeCells, colWidths: 60 });

        // The span cell of the clone is empty, so the clone's rows keep the height of a plain row. (The
        // master's rows under the block do grow for the text, which the clone covers.)
        const plainRowHeight = await grid.rowHeightInOverlay('master', 0, 0);

        expect(plainRowHeight).not.toBeNull();

        for (const row of FROZEN_ROWS) {
          // One pixel of slack: the first rendered row of a table carries a border its siblings do not.
          await expect.poll(async () => Math.abs((await grid.rowHeightInOverlay('bottom', row, 0))! - plainRowHeight!))
            .toBeLessThanOrEqual(1);
        }
      });

      test('carries the span in the corner overlay when the block starts in the frozen column', async () => {
        await grid.initGrid({
          fixedRowsBottom: 2,
          fixedColumnsStart: 1,
          mergeCells: mergeCellsFor(mode, BLOCK_IN_FIRST_COLUMN),
        });

        await expect.poll(() => grid.overlayCellState('bottom_inline_start_corner', 8, 0))
          .toEqual({ displayed: true, rowspan: '2', text: '', className: expect.any(String) });

        for (const row of FROZEN_ROWS) {
          for (const col of [1, 2]) {
            await expect.poll(() => grid.cellOffsetFromColumnHeader('bottom', row, col)).toBe(0);
          }
        }
      });
    });
  }
});
