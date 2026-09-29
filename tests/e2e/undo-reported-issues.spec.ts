import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

/**
 * Undo bugs reported in ClickUp that need a real browser: ColumnSummary calculates on the first
 * visible render, and autofill is a drag of the fill handle. Each test fails on the 18.x UndoRedo.
 * The cases a unit test can drive live in
 * `handsontable/src/plugins/undoRedo/__tests__/reportedIssues.unit.js`.
 */
test.describe('undo of reported cases', () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('ColumnSummary', () => {
    // DEV-516: the summary write used to be a step of its own, so the first undo only touched the sum.
    test('one undo reverts an edit of a numeric cell and its summary', async () => {
      await grid.initSummaryGrid('sum', { numeric: true });

      expect(await grid.cellValue(4, 0)).toBe(10);

      await grid.setCell(0, 0, 100);

      expect(await grid.cellValue(4, 0)).toBe(109);
      expect(await grid.undoStackSize()).toBe(1);

      await grid.undo();

      expect(await grid.cellValue(0, 0)).toBe(1);
      expect(await grid.cellValue(4, 0)).toBe(10);
    });

    // DEV-496: the row came back only on the third undo.
    test('one undo brings back a removed row', async () => {
      await grid.initSummaryGrid('sum');
      const before = await grid.columnValues(0);

      await grid.removeRows(1, 1);

      expect(await grid.cellValue(4 - 1, 0)).toBe(8);
      expect(await grid.undoStackSize()).toBe(1);

      await grid.undo();

      expect(await grid.columnValues(0)).toEqual(before);
    });

    // DEV-777: a summary write is never a user action, whatever the summary type.
    for (const type of ['min', 'custom'] as const) {
      test(`nothing is undoable after a "${type}" summary is calculated`, async () => {
        await grid.initSummaryGrid(type);

        expect(await grid.cellValue(4, 0)).toBe(type === 'min' ? 1 : 'computed');
        expect(await grid.isUndoAvailable()).toBe(false);
      });
    }

    // DEV-903: with a custom validator the edit landed after the summary write, and undo missed it.
    test('one undo reverts an edit of a cell with a custom validator and its summary', async () => {
      await grid.initSummaryGrid('sum', { validator: true });

      await grid.setCell(0, 0, 111);

      expect(await grid.cellValue(4, 0)).toBe(120);

      await grid.undo();

      expect(await grid.cellValue(0, 0)).toBe(1);
      expect(await grid.cellValue(4, 0)).toBe(10);
    });
  });

  test.describe('autofill of merged cells', () => {
    // DEV-184: the merges the autofill created stayed after the undo.
    test('an undo removes the merges an autofill of a merged area created', async () => {
      await grid.initGrid({ mergeCells: true });
      await grid.mergeWithShortcut([0, 3, 1, 4]);

      const row0 = await grid.rowValues(0);

      await grid.fillSelectionTo([0, 3, 1, 4], 0, 6);
      await expect.poll(() => grid.merges()).toEqual([[0, 3, 2, 2], [0, 5, 2, 2]]);

      await grid.undo();

      expect(await grid.merges()).toEqual([[0, 3, 2, 2]]);
      expect(await grid.rowValues(0)).toEqual(row0);
    });

    // DEV-520: autofill from a merge declared in the settings, then undo.
    test('an undo leaves only the merge the autofill started from', async () => {
      await grid.initGrid({ mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 3 }] });

      const row0 = await grid.rowValues(0);

      await grid.fillSelectionTo([0, 0, 2, 2], 1, 5);
      await expect.poll(() => grid.merges()).toEqual([[0, 0, 3, 3], [0, 3, 3, 3]]);

      await grid.undo();

      expect(await grid.merges()).toEqual([[0, 0, 3, 3]]);
      expect(await grid.rowValues(0)).toEqual(row0);
    });
  });
});
