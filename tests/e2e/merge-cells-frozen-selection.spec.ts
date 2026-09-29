import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * A merged cell that crosses a freeze line is rendered once per overlay, and each overlay shows only
 * the part of the block its own band covers. Selecting it used to draw a closed selection box around
 * every part, so the freeze lines showed as selection edges through the merged cell, and every
 * overlay drew its own fill handle (DEV-143). The selection must look like the one of an unmerged
 * block: one outline and one fill handle, on the block's bottom-end corner.
 */
test.describe('selection of a merged cell across the frozen panes', () => {
  let grid: SelectionFeaturesPage;

  const BLOCK_ACROSS_BOTH_LINES = { row: 0, col: 0, rowspan: 3, colspan: 3 };
  // The fill handle's center sits on the block's corner; allow for the handle's own offset and the
  // theme's border widths.
  const CORNER_TOLERANCE = 4;

  /**
   * An outline drawn on every track of every side of a `rows` x `columns` block.
   *
   * @param {number} rows The block's row span.
   * @param {number} columns The block's column span.
   * @returns {object}
   */
  function fullOutline(rows: number, columns: number) {
    return {
      top: Array(columns).fill(true),
      bottom: Array(columns).fill(true),
      left: Array(rows).fill(true),
      right: Array(rows).fill(true),
    };
  }

  /**
   * Asserts one outline around the block and exactly one reachable fill handle, owned by the given
   * overlay and centered on the block's bottom-end corner.
   *
   * @param {number} row The block's root row.
   * @param {number} col The block's root column.
   * @param {object} span The block's `rowspan` and `colspan`.
   * @param {string} owner The overlay expected to own the fill handle.
   */
  async function expectOneOutlineAndHandle(
    row: number, col: number, span: { rowspan: number, colspan: number }, owner = 'ht_master',
  ): Promise<void> {
    await expect.poll(async () => (await grid.mergedBlockSelection(row, col)).fillHandles.length).toBe(1);

    const { edgesInside, outline, fillHandles } = await grid.mergedBlockSelection(row, col);

    expect(edgesInside).toEqual([]);
    expect(outline).toEqual(fullOutline(span.rowspan, span.colspan));
    expect(fillHandles[0].overlay).toBe(owner);
    expect(Math.abs(fillHandles[0].dx)).toBeLessThanOrEqual(CORNER_TOLERANCE);
    expect(Math.abs(fillHandles[0].dy)).toBeLessThanOrEqual(CORNER_TOLERANCE);
  }

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  test('draws one outline and one fill handle for a block crossing both freeze lines', async () => {
    await grid.initGrid({ fixedRowsTop: 2, fixedColumnsStart: 2, mergeCells: [BLOCK_ACROSS_BOTH_LINES] });
    await grid.selectCells(0, 0, 0, 0);

    await expectOneOutlineAndHandle(0, 0, BLOCK_ACROSS_BOTH_LINES);
  });

  test('draws one outline and one fill handle with virtualized merged cells', async () => {
    // With `virtualized`, MergeCells clamps the block's spans to each overlay's band itself, and the
    // `modifyGetCellCoords` extent the fix reads is clamped to the master's band.
    await grid.initGrid({
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      mergeCells: { virtualized: true, cells: [BLOCK_ACROSS_BOTH_LINES] },
    });
    await grid.selectCells(0, 0, 0, 0);

    await expectOneOutlineAndHandle(0, 0, BLOCK_ACROSS_BOTH_LINES);
  });

  test('draws one outline and one fill handle for a block crossing the row freeze line only', async () => {
    const block = { row: 1, col: 1, rowspan: 3, colspan: 2 };

    await grid.initGrid({ fixedRowsTop: 2, mergeCells: [block] });
    await grid.selectCells(1, 1, 1, 1);

    await expectOneOutlineAndHandle(1, 1, block);
  });

  test('draws one outline and one fill handle for a block crossing the column freeze line only', async () => {
    const block = { row: 1, col: 1, rowspan: 2, colspan: 3 };

    await grid.initGrid({ fixedColumnsStart: 2, mergeCells: [block] });
    await grid.selectCells(1, 1, 1, 1);

    await expectOneOutlineAndHandle(1, 1, block);
  });

  test('keeps the fill handle of a block that fits inside the frozen corner', async () => {
    // Nothing crosses a freeze line here: the corner overlay renders the whole block, so it keeps
    // its handle. The copies the master and the other clones draw sit under the corner.
    const block = { row: 0, col: 0, rowspan: 2, colspan: 2 };

    await grid.initGrid({ fixedRowsTop: 3, fixedColumnsStart: 3, mergeCells: [block] });
    await grid.selectCells(0, 0, 0, 0);

    await expectOneOutlineAndHandle(0, 0, block, 'ht_clone_top_inline_start_corner');
  });

  test('draws one fill handle when an area selection ends inside a block crossing both freeze lines', async () => {
    // The selection grows to cover the whole block, so its bottom-end corner is the block's. The
    // clones that clamp the area to their band land on the block's root cell, and the
    // `modifyGetCellCoords` remap then points each of them at that same corner.
    await grid.initGrid({
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 3 }],
    });
    await grid.selectCells(0, 0, 2, 2);

    await expect.poll(async () => (await grid.mergedBlockSelection(1, 1)).fillHandles).toEqual([
      expect.objectContaining({ overlay: 'ht_master' }),
    ]);
  });

  test('draws one outline and one fill handle in a right-to-left grid', async () => {
    await grid.initGrid({
      layoutDirection: 'rtl',
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      mergeCells: [BLOCK_ACROSS_BOTH_LINES],
    });
    await grid.selectCells(0, 0, 0, 0);

    await expectOneOutlineAndHandle(0, 0, BLOCK_ACROSS_BOTH_LINES);
  });

  test('draws no edge on the freeze line when a virtualized block is scrolled under the frozen rows', async () => {
    // The master renders only the block's lower part, and the `top` overlay its top rows. The
    // extent the fix reads is clamped to the master's band here, so this is the case where the
    // two merged-cell modes differ.
    await grid.initGrid({
      data: Array.from({ length: 80 }, (_, row) => Array.from({ length: 10 }, (__, col) => `R${row + 1}C${col + 1}`)),
      fixedRowsTop: 2,
      mergeCells: { virtualized: true, cells: [{ row: 1, col: 1, rowspan: 30, colspan: 2 }] },
    });
    await grid.selectCells(1, 1, 1, 1);
    await grid.scrollToRow(12);

    // Proves the redraw landed and the block's outline is actually on screen, so the two checks
    // below cannot pass merely because nothing was drawn at all.
    await expect.poll(() => grid.isSelectionEdgeAtColumnStart(12, 1)).toBe(true);

    expect(await grid.isSelectionEdgeOnFrozenRowsLine(1)).toBe(false);
    expect(await grid.isSelectionEdgeOnFrozenRowsLine(2)).toBe(false);
  });

  test('draws one outline for a custom border on a block crossing both freeze lines', async () => {
    // Custom borders draw through the same single-coordinate path as a merged focus cell.
    const side = { width: 2, color: 'red' };

    await grid.initGrid({
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      mergeCells: [BLOCK_ACROSS_BOTH_LINES],
      customBorders: [{ row: 0, col: 0, top: side, bottom: side, start: side, end: side }],
    });

    await expect.poll(async () => (await grid.mergedBlockSelection(0, 0)).outline)
      .toEqual(fullOutline(3, 3));
    expect((await grid.mergedBlockSelection(0, 0)).edgesInside).toEqual([]);
  });
});
