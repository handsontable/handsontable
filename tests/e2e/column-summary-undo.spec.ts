import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

/**
 * Undo on a grid with a ColumnSummary. A summary write belongs to the action that caused it, so it
 * is never a step of its own. The summary is calculated on the first visible render, which is why
 * these run in a browser and not in jsdom.
 */
test.describe('undo with a column summary', () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
  });

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

    expect(await grid.cellValue(3, 0)).toBe(8);
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
