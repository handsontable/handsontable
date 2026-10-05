import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

/**
 * Undo and redo across index transformations.
 *
 * An undo step restores the snapshot of the row and column order, the sort and the trims taken
 * before the step, and replays the data changes by physical index. A removal made on a reordered
 * or trimmed grid therefore comes back on the records it took, at the visual places they held.
 *
 * The fixture's data is `<column letter><row number>` over a 6x7 grid, so cell (0, 0) reads `A1`
 * and every value names the record it belongs to.
 */
test.describe('undo across index transformations', () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('undoing a removal of several columns on a moved column order restores the order and the values', async () => {
    await grid.initGrid({ manualColumnMove: [3, 2, 0, 6, 1, 5, 4] });

    expect(await grid.rowValues(0)).toEqual(['D1', 'C1', 'A1', 'G1', 'B1', 'F1', 'E1']);

    // Visual columns 1-3 are the physical columns 2, 0 and 6 - not a contiguous physical block.
    await grid.removeColumns(1, 3);

    expect(await grid.columnCount()).toBe(4);
    expect(await grid.rowValues(0)).toEqual(['D1', 'B1', 'F1', 'E1']);

    await grid.undo();

    expect(await grid.columnCount()).toBe(7);
    expect(await grid.rowValues(0)).toEqual(['D1', 'C1', 'A1', 'G1', 'B1', 'F1', 'E1']);
    expect(await grid.rowValues(5)).toEqual(['D6', 'C6', 'A6', 'G6', 'B6', 'F6', 'E6']);

    await grid.redo();

    expect(await grid.rowValues(0)).toEqual(['D1', 'B1', 'F1', 'E1']);
  });

  test('undoing a removal of rows on a sorted grid puts the records back in the sorted order', async () => {
    await grid.initGrid({ columnSorting: true });
    await grid.sort({ column: 0, sortOrder: 'desc' });

    expect(await grid.columnValues(0)).toEqual(['A6', 'A5', 'A4', 'A3', 'A2', 'A1']);

    await grid.removeRows(1, 2);

    expect(await grid.columnValues(0)).toEqual(['A6', 'A3', 'A2', 'A1']);

    await grid.undo();

    expect(await grid.columnValues(0)).toEqual(['A6', 'A5', 'A4', 'A3', 'A2', 'A1']);
    expect(await grid.rowValues(1)).toEqual(['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5']);
    expect(await grid.sortConfig()).toEqual([{ column: 0, sortOrder: 'desc' }]);

    // The sort is a step of its own, undone next.
    await grid.undo();

    expect(await grid.columnValues(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
    expect(await grid.sortConfig()).toEqual([]);
  });

  test('undoing a removal of rows next to a trimmed row keeps the trimmed record trimmed', async () => {
    await grid.initGrid({ trimRows: [1] });

    expect(await grid.columnValues(0)).toEqual(['A1', 'A3', 'A4', 'A5', 'A6']);

    // Visual rows 0 and 1 are the physical rows 0 and 2, on both sides of the trimmed row 1.
    await grid.removeRows(0, 2);

    expect(await grid.columnValues(0)).toEqual(['A4', 'A5', 'A6']);
    expect(await grid.sourceRowCount()).toBe(4);

    await grid.undo();

    expect(await grid.columnValues(0)).toEqual(['A1', 'A3', 'A4', 'A5', 'A6']);
    expect(await grid.sourceRowCount()).toBe(6);

    await grid.redo();

    expect(await grid.columnValues(0)).toEqual(['A4', 'A5', 'A6']);
    expect(await grid.sourceRowCount()).toBe(4);
  });
});
