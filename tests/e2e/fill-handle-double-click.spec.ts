import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * The copy-down gesture: a double-click on the fill handle copies the selection into the empty
 * cells below, as far as the neighbouring column is filled. The gesture ends on the second
 * mouseup, and both the fill and the Autofill plugin's drag state have to be settled by then —
 * Walkontable's synthesized double-click and the plugin's own `mouseup` cleanup are driven by the
 * same native event (GitHub #13370).
 */
test.describe('fill handle double-click', { tag: THEMES_TAG }, () => {
  let grid: SelectionFeaturesPage;

  // Column A filled all the way down, column B filled in rows 0–2 only: the copy-down from B3
  // has an extent (rows 3–7), which is the case that used to leave the drag state armed.
  const DATA = Array.from({ length: 8 }, (_, row) => [
    `A${row + 1}`,
    row < 3 ? `B${row + 1}` : null,
    null,
    null,
  ]);

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionFeaturesPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid({ data: DATA });
  });

  test('ends the drag state once the double-click fill-down is applied', async () => {
    await grid.selectCells(2, 1, 2, 1);
    await grid.doubleClickFillHandle();

    // The precondition for the bug: the fill-down actually applied.
    await expect(grid.cell(3, 1)).toHaveText('B3');
    await expect(grid.cell(7, 1)).toHaveText('B3');

    // Move around with no button held. A stuck drag state redraws the fill border under the pointer.
    await grid.hoverCell(0, 3);
    await grid.hoverCell(6, 2);

    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });

  // Not a regression test for #13370 (every corner mousedown re-arms the drag state, so it passes
  // on the unfixed code too). It guards the teardown against over-resetting: a fix that tore the
  // drag state down too eagerly would break the very next drag-fill.
  test('keeps the fill handle usable for a drag after a double-click fill-down', async () => {
    await grid.selectCells(2, 1, 2, 1);
    await grid.doubleClickFillHandle();
    await expect(grid.cell(7, 1)).toHaveText('B3');

    await grid.selectCells(0, 0, 0, 0);
    await grid.dragFillHandleTo(0, 2);

    await expect(grid.cell(0, 1)).toHaveText('A1');
    await expect(grid.cell(0, 2)).toHaveText('A1');
    await expect(grid.visibleFillBorders()).toHaveCount(0);
    expect(await grid.isFillHandlePressed()).toBe(false);
  });

  // DEV-859: how far the copy-down fills. It follows one guide column (the left neighbor, else the
  // right one), stops above the first value already in the filled column (never overwriting it), and
  // at the first gap in the guide column, as spreadsheet applications do. Before the fix a value
  // anywhere below blocked the whole fill, and a gap in the neighboring column was filled across.
  test('fills down to the row above the first value already in the column (DEV-859, case 1)', async () => {
    const N = null;

    await grid.initGrid({
      data: [[0, 0], [N, 0], [N, 1], [N, 2], [N, 3], [9, 0], [9, 0], [9, 0]],
    });
    await grid.selectCells(0, 0, 0, 0);
    await grid.doubleClickFillHandle();

    // The 9s in A6:A8 make a fill that runs past them visible.
    expect(await grid.columnValues(0)).toEqual([0, 0, 0, 0, 0, 9, 9, 9]);
    expect(await grid.columnValues(1)).toEqual([0, 0, 1, 2, 3, 0, 0, 0]);
  });

  test('stops at the first gap in the neighboring column (DEV-859, case 2)', async () => {
    const N = null;

    await grid.initGrid({
      data: [[1, 1], [N, 0], [N, 0], [N, 0], [N, 1], [N, 0], [N, 0], [N, N], [N, N], [N, N], [N, 1]],
    });
    await grid.selectCells(0, 0, 0, 0);
    await grid.doubleClickFillHandle();

    expect(await grid.columnValues(0)).toEqual([1, 1, 1, 1, 1, 1, 1, N, N, N, N]);
  });

  test('fills nothing when the neighboring cell right below the selection is empty', async () => {
    const N = null;

    await grid.initGrid({ data: [[5, 1], [N, N], [N, 3], [N, 4], [N, N]] });
    await grid.selectCells(0, 0, 0, 0);
    await grid.doubleClickFillHandle();

    expect(await grid.columnValues(0)).toEqual([5, N, N, N, N]);
  });

  // Not a regression test: the old rule gave up here too. It pins the "never overwrite" half for
  // a value in the very next row.
  test('fills nothing when the cell right below the selection already has a value', async () => {
    const N = null;

    await grid.initGrid({ data: [[5, 1], [9, 2], [N, 3], [N, N]] });
    await grid.selectCells(0, 0, 0, 0);
    await grid.doubleClickFillHandle();

    expect(await grid.columnValues(0)).toEqual([5, 9, N, N]);
  });

  test('follows the left neighbor, not the right one, when both have values below the selection', async () => {
    const N = null;

    // Left column: rows 1-3. Right column: rows 3-6. The left one guides, so the fill stops at row 3.
    await grid.initGrid({ data: [[1, 5, N], [2, N, N], [3, N, 7], [N, N, 7], [N, N, 7], [N, N, 7]] });
    await grid.selectCells(0, 1, 0, 1);
    await grid.doubleClickFillHandle();

    expect(await grid.columnValues(1)).toEqual([5, 5, 5, N, N, N]);
  });

  test('reads a merged cell in the neighboring column as one value', async () => {
    const N = null;

    await grid.initGrid({
      data: [[5, 'x'], [N, N], [N, 'y'], [N, 'z'], [N, N]],
      mergeCells: [{ row: 0, col: 1, rowspan: 2, colspan: 1 }],
    });
    await grid.selectCells(0, 0, 0, 0);
    await grid.doubleClickFillHandle();

    expect(await grid.columnValues(0)).toEqual([5, 5, 5, 5, N]);
  });

  test('does not stop at a hidden row', async () => {
    const N = null;

    // Row 3 is hidden and its neighbor is empty; the user cannot see it, so it does not end the fill.
    await grid.initGrid({
      data: [[5, 1], [N, 2], [N, N], [N, 4], [N, 5], [N, N]],
      hiddenRows: { rows: [2] },
    });
    await grid.selectCells(0, 0, 0, 0);
    await grid.doubleClickFillHandle();

    const values = await grid.columnValues(0);

    expect([values[1], values[3], values[4], values[5]]).toEqual([5, 5, 5, N]);
  });
});
