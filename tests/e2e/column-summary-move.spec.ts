import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * ColumnSummary endpoint coordinates (`sourceColumn`, `destinationColumn`, `destinationRow`, `ranges`)
 * are documented as PHYSICAL indexes. Before the fix, several read and write sites (`getCellValue`, the
 * `afterChange` source-column match, and the result write) used those physical coordinates as if they
 * were VISUAL: no `afterColumnMove` hook exists on either side of the fix, so after a column move the
 * summary kept watching and writing the pre-move visual position instead of following its column. A row
 * move took a different path: `afterRowMove` used to rewrite `ranges` in place on every move, which
 * corrupted them from the second move on. After the fix, reads and writes translate physical to visual
 * correctly, and a row move only triggers a plain recalculation - the ranges themselves are never
 * rewritten, since they were never physically wrong to begin with.
 */
test.describe('columnSummary across manualColumnMove and manualRowMove', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  test('a column move relocates its summary and does not duplicate it', async () => {
    await grid.initGrid({
      data: [[3, 6, 9], [2, 7, 6], [5, 3, 4], [null, null, null]],
      manualColumnMove: true,
      columnSummary: [{ destinationRow: 0, destinationColumn: 0, reversedRowCoords: true, type: 'sum' }],
    });

    // Premise: the plugin sums physical column 0 (3 + 2 + 5) into the last row.
    expect(await grid.cellValue(3, 0)).toBe(10);

    await grid.moveColumns([0], 1);

    expect(await grid.columnOrder()).toEqual([1, 0, 2]);

    // The summary result travels with its physical column - true on unfixed code too, since the value
    // itself simply moves with the cell it was written into. Stated here as the test's precondition.
    expect(await grid.cellValue(3, 1)).toBe(10);
    expect(await grid.cellValue(3, 0)).toBeNull();

    // Discriminator: editing the moved column (now visual 1, physical 0, was 3) must update ITS
    // summary. Before the fix the summary kept reading the old visual column and never saw this edit.
    await grid.setCellValue(0, 1, 4);
    expect(await grid.cellValue(3, 1)).toBe(11);

    // Discriminator: editing the column that slid into the vacated visual slot (now visual 0,
    // physical 1, was 6) must not create a second summary there. Before the fix it did.
    await grid.setCellValue(0, 0, 1);
    expect(await grid.cellValue(3, 0)).toBeNull();
    expect(await grid.cellValue(3, 1)).toBe(11);

    // Exactly one cell in the destination row carries the summary-result class, at its new column.
    expect(await grid.cellClassName(3, 0)).toBeUndefined();
    expect(await grid.cellClassName(3, 1)).toBe('columnSummaryResult');
    expect(await grid.cellClassName(3, 2)).toBeUndefined();
  });

  test('undo restores the pre-move summary position, and redo relocates it again', async () => {
    await grid.initGrid({
      data: [[3, 6, 9], [2, 7, 6], [5, 3, 4], [null, null, null]],
      manualColumnMove: true,
      undo: true,
      columnSummary: [{ destinationRow: 0, destinationColumn: 0, reversedRowCoords: true, type: 'sum' }],
    });

    await grid.moveColumns([0], 1);
    expect(await grid.columnOrder()).toEqual([1, 0, 2]);

    await grid.undo();

    // Premise: undo really restored the identity order and the summary's original position.
    expect(await grid.columnOrder()).toEqual([0, 1, 2]);
    expect(await grid.cellValue(3, 0)).toBe(10);

    await grid.redo();

    expect(await grid.columnOrder()).toEqual([1, 0, 2]);

    // Discriminator: after the redo, the summary must follow the column again rather than stay
    // parked wherever undo had temporarily put it.
    await grid.setCellValue(0, 1, 4);
    expect(await grid.cellValue(3, 1)).toBe(11);
    expect(await grid.cellValue(3, 0)).toBeNull();
  });

  test('a row move recalculates without corrupting the summary range on a second move', async () => {
    await grid.initGrid({
      data: [[1], [2], [3], [4], [null]],
      manualRowMove: true,
      columnSummary: [{ destinationRow: 4, destinationColumn: 0, ranges: [[0, 3]], type: 'sum' }],
    });

    // Premise: the plugin sums physical rows 0-3 (1 + 2 + 3 + 4) into the last row.
    expect(await grid.cellValue(4, 0)).toBe(10);

    await grid.moveRows([1], 0);
    expect(await grid.rowOrder()).toEqual([1, 0, 2, 3, 4]);

    // A second move (restoring the identity order) is what used to corrupt the range.
    await grid.moveRows([1], 0);
    expect(await grid.rowOrder()).toEqual([0, 1, 2, 3, 4]);

    // The underlying physical rows never changed, so the sum must still be 10. Before the fix, the
    // second move corrupted `ranges` and this drifted (the reported symptom read 8).
    expect(await grid.cellValue(4, 0)).toBe(10);

    // Discriminator: the range must still cover every source row after two moves, not a shrunken one.
    await grid.setCellValue(0, 0, 5);
    expect(await grid.cellValue(4, 0)).toBe(14);
  });

  test('moving the summary row itself after a data row move keeps the summary live at its new position', async () => {
    await grid.initGrid({
      data: [[1], [2], [3], [4], [null]],
      manualRowMove: true,
      columnSummary: [{ destinationRow: 4, destinationColumn: 0, ranges: [[0, 3]], type: 'sum' }],
    });

    expect(await grid.cellValue(4, 0)).toBe(10);

    // A data row move first, then the summary row to the top. Before the fix the second move re-read the
    // already-physical range as visual and dropped a record from it.
    await grid.moveRows([1], 0);
    await grid.moveRows([4], 0);
    expect(await grid.rowOrder()).toEqual([4, 1, 0, 2, 3]);

    expect(await grid.cellValue(0, 0)).toBe(10);

    // Visual row 1 is physical row 1 (value 2).
    await grid.setCellValue(1, 0, 102);
    expect(await grid.cellValue(0, 0)).toBe(110);
  });
});
