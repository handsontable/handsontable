import { test, expect } from '../../fixtures/test';
import { MergedCellsFrozenColumnsPage } from '../../fixtures/pages/MergedCellsFrozenColumnsPage';

/**
 * Walkontable writes a row's height on the row's first cell. With row headers that is always a 1x1
 * header cell, but without them it can be a merged block's cell that spans several rows, or a cell the
 * block covers and hides. Such a row had no cell to carry its own height: MergeCells inflated the
 * spanning cell to the block's total, which left the browser free to split the total between the rows,
 * and its top-overlay branch inflated a one-row cell as well. Each pane then drew the rows at different
 * heights (the frozen panes against the master, and the master against itself as it scrolled).
 *
 * The grid below is the reported shape: no row headers, two frozen top rows, frozen columns holding
 * two-row blocks, and a one-row block among the two-row blocks of the scrollable columns.
 */
test.describe('row heights of merged rows next to frozen columns', { tag: '@walkontable' }, () => {
  let grid: MergedCellsFrozenColumnsPage;

  const ROWS = [0, 1, 2, 3, 4];
  const TWO_ROW_BLOCKS = [0, 1, 2, 4, 5, 10, 11, 12, 13, 14, 15]
    .map(col => ({ row: 0, col, rowspan: 2, colspan: 1 }));
  const ONE_ROW_BLOCK = { row: 0, col: 6, rowspan: 1, colspan: 4 };
  // Row 0 is made tall by a block of fixed height in a two-row merged cell, so the block's total height
  // is larger than the two rows would need on their own.
  // No column overscan, so a scroll to the one-row block makes it the first cell of the row in the master and
  // in the top clone, which is the shape the reported misalignment needs.
  const SETTINGS = {
    viewportColumnRenderingOffset: 0,
    rowHeaders: false,
    colHeaders: false,
    fixedRowsTop: 2,
    fixedColumnsStart: 3,
    autoRowSize: true,
    mergeCells: [...TWO_ROW_BLOCKS, ONE_ROW_BLOCK],
    values: [{ row: 0, col: 4, value: 'tall:60' }],
  };

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new MergedCellsFrozenColumnsPage(page, theme, bundle);
    await grid.goto();
  });

  test('draws every row at the same offset and height in every pane', async () => {
    await grid.initGrid(SETTINGS);

    await expect.poll(() => grid.rowsDisagreeingWithMaster(ROWS)).toEqual([]);
  });

  test('keeps the panes aligned once scrolled to the one-row block', async () => {
    await grid.initGrid(SETTINGS);
    await grid.scrollToColumn(ONE_ROW_BLOCK.col);

    // The premise: the one-row block is the first cell of row 0 in the scrollable panes.
    expect(await grid.masterFirstRenderedColumn()).toBe(ONE_ROW_BLOCK.col);

    await expect.poll(() => grid.rowsDisagreeingWithMaster(ROWS)).toEqual([]);
  });

  test('keeps the row heights inside a block when the grid scrolls horizontally', async () => {
    await grid.initGrid(SETTINGS);

    // Row 1 holds no content of its own, so it keeps a normal row's height wherever the master's band
    // starts. The browser's own split of the block gave it part of row 0's height instead.
    const normal = await grid.masterRowHeight(3);

    await expect.poll(() => grid.masterRowHeight(1)).toBe(normal);

    await grid.scrollToColumn(ONE_ROW_BLOCK.col);

    await expect.poll(() => grid.masterRowHeight(1)).toBe(normal);
  });

  test('draws every row at the same offset and height when the heights come from rowHeights', async () => {
    await grid.initGrid({ ...SETTINGS, autoRowSize: false, rowHeights: [70], values: [] });
    await grid.scrollToColumn(ONE_ROW_BLOCK.col);

    await expect.poll(() => grid.rowsDisagreeingWithMaster(ROWS)).toEqual([]);
    await expect.poll(() => grid.masterRowHeight(0)).toBe(70);
  });

  test('draws every row at the same offset and height when the heights are measured, not sampled', async () => {
    // Without AutoRowSize, row 0's height is only what the engine measured from the rendered cells.
    await grid.initGrid({ ...SETTINGS, autoRowSize: false });
    await grid.scrollToColumn(ONE_ROW_BLOCK.col);

    await expect.poll(() => grid.rowsDisagreeingWithMaster(ROWS)).toEqual([]);
    expect(await grid.masterRowHeight(1)).toBe(await grid.masterRowHeight(3));
  });

  test('keeps a block whose first row is hidden to its own rows', async () => {
    // The block's first cell carries the span from row 1 down to row 2 only; counting the block's row count
    // from there reached row 3 and made rows 1 and 2 taller in the frozen pane than in the master.
    await grid.initGrid({
      viewportColumnRenderingOffset: 0,
      rowHeaders: false,
      colHeaders: false,
      fixedColumnsStart: 1,
      hiddenRows: { rows: [0] },
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 1 }],
    });
    await grid.scrollToColumn(6);

    await expect.poll(() => grid.rowsDisagreeingWithMaster([1, 2, 3, 4])).toEqual([]);
    // Stretched rows are recorded and the master follows them, so the panes can agree on the wrong heights.
    expect(await grid.masterRowHeight(2)).toBe(await grid.masterRowHeight(4));
  });

  test('gives back a normal height to a plain row drawn in a reused row element', async () => {
    // A guard for the fix: the rows of the first blocks carry their height on the row element, and
    // once scrolled down the engine reuses those elements for plain rows, which must not keep it.
    const blocks = Array.from({ length: 5 }, (_, i) => ({ row: i * 2, col: 0, rowspan: 2, colspan: 1 }));
    const tallValues = blocks.map(({ row }) => ({ row, col: 0, value: 'tall:60' }));

    await grid.initGrid({ ...SETTINGS, fixedRowsTop: 0, mergeCells: blocks, values: tallValues });
    await grid.scrollToRow(20);

    const plainRows = [20, 21, 22, 23, 24];

    await expect.poll(() => grid.rowsDisagreeingWithMaster(plainRows)).toEqual([]);

    const heights = await Promise.all(plainRows.map(row => grid.masterRowHeight(row)));

    expect(new Set(heights).size).toBe(1);
  });

  test('draws every row at the same offset and height with renderMode: onChange', async () => {
    await grid.initGrid({ ...SETTINGS, renderMode: 'onChange' });
    await grid.scrollToColumn(ONE_ROW_BLOCK.col);

    await expect.poll(() => grid.rowsDisagreeingWithMaster(ROWS)).toEqual([]);
  });
});
