import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * The fill handle and a non-contiguous selection (DEV-540).
 *
 * Selection drew the handle from the ACTIVE range only (`isMultiple()` asks whether that range spans
 * more than one cell), so a selection of two or more ranges still showed one handle, on the last
 * range. Autofill fills from the last range alone, so dragging it silently ignored every other range.
 * Spreadsheet applications hide the handle for such a selection, and so does the grid now.
 */
test.describe('fill handle with a non-contiguous selection', { tag: THEMES_TAG }, () => {
  let grid: SelectionFeaturesPage;

  const DATA = Array.from({ length: 8 }, (_, row) => (
    Array.from({ length: 5 }, (__, col) => `${String.fromCharCode(65 + col)}${row + 1}`)
  ));

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionFeaturesPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid({ data: DATA, fillHandle: true, selectionHandles: false, moveCells: false });
  });

  // Controls: a single range keeps its handle, whether it is one cell or several.
  test('shows the fill handle for a single cell and for a single range', async () => {
    await grid.selectCells(1, 1, 1, 1);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(1);

    await grid.selectCells(1, 1, 2, 2);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(1);
  });

  test('hides the fill handle once Ctrl/Cmd+click adds a second cell, and shows it again for one cell', async () => {
    await grid.cell(1, 1).click();
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(1);

    await grid.ctrlClickCell(4, 3);
    expect(await grid.selectedLayerCount()).toBe(2);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);

    await grid.cell(6, 2).click();
    expect(await grid.selectedLayerCount()).toBe(1);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(1);
  });

  // Both corners are covered: the last range being a multi-cell range draws the AREA corner, a
  // single cell draws the CELL corner, and each was gated by its own predicate.
  test('hides the fill handle once Ctrl/Cmd+drag adds a second range', async () => {
    await grid.dragSelectCells(1, 1, 2, 2);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(1);

    await grid.ctrlDragSelectCells(4, 3, 5, 4);
    expect(await grid.selectedLayerCount()).toBe(2);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);
  });

  test('hides the fill handle once Ctrl/Cmd+click on a row header adds a second whole row', async () => {
    await grid.clickRowHeader(1);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(1);

    await grid.ctrlClickRowHeader(4);
    expect(await grid.selectedLayerCount()).toBe(2);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);
  });

  // Ctrl/Cmd+A replaces a non-contiguous selection with one range, so the handle must come back.
  test('shows the fill handle again after Ctrl/Cmd+A replaces a non-contiguous selection', async () => {
    await grid.cell(1, 1).click();
    await grid.ctrlClickCell(4, 3);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);

    await grid.pressSelectAll();
    expect(await grid.selectedLayerCount()).toBe(1);
    await expect(grid.fillHandlesInAnyOverlay().first()).toBeVisible();
  });

  test('hides the fill handle for several ranges set through selectCells()', async () => {
    await grid.selectRanges([[1, 1, 2, 2], [4, 3, 5, 4]]);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);

    await grid.selectRanges([[1, 1, 2, 2], [4, 3, 4, 3]]);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);

    await grid.selectRanges([[0, 0, 0, 0], [2, 2, 3, 3], [6, 4, 7, 4]]);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);
  });

  // Frozen rows and columns are drawn by overlay clones, each with its own copy of the handle, so a
  // range in a frozen pane must lose every copy, not only the master's.
  test('hides every copy of the fill handle for a non-contiguous selection across frozen panes', async () => {
    await grid.initGrid({
      data: DATA,
      fillHandle: true,
      selectionHandles: false,
      moveCells: false,
      fixedColumnsStart: 1,
      fixedRowsTop: 1,
      fixedRowsBottom: 1,
    });

    // Frozen column + a scrolling cell.
    await grid.clickTopmostCell(3, 0);
    await expect(grid.fillHandlesInAnyOverlay().first()).toBeVisible();
    await grid.clickTopmostCell(5, 3, true);
    expect(await grid.selectedLayerCount()).toBe(2);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);

    // Frozen top row + frozen column.
    await grid.clickTopmostCell(0, 2);
    await expect(grid.fillHandlesInAnyOverlay().first()).toBeVisible();
    await grid.clickTopmostCell(4, 0, true);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);

    // Frozen bottom row + a scrolling cell.
    await grid.clickTopmostCell(7, 2);
    await expect(grid.fillHandlesInAnyOverlay().first()).toBeVisible();
    await grid.clickTopmostCell(2, 4, true);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);
  });

  test('hides the fill handle for two full-height column ranges selected together', async () => {
    // Positive control: one full-height column draws its handle, so the zero below is not a handle
    // that was never drawn for such a range in the first place.
    await grid.selectRanges([[0, 1, 7, 1]]);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(1);

    await grid.selectRanges([[0, 1, 7, 1], [0, 3, 7, 3]]);
    await expect(grid.fillHandlesInAnyOverlay()).toHaveCount(0);
  });
});
