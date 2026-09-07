import { test, expect } from '../fixtures/test';
import { UndoRemoveRowSchemaPage } from '../fixtures/pages/UndoRemoveRowSchemaPage';

/**
 * #5833 – undo of a row removal when `dataSchema` is a function returning non-plain rows.
 * "getter": rows are constructor instances with a non-configurable derived getter.
 * "accessor": the docs' function-data-source pattern (function `columns[].data`).
 * Before the fix both threw out of `undo()` and left UndoRedo unable to record further actions.
 */
test.describe('undo of remove_row with a function dataSchema', () => {
  let grid: UndoRemoveRowSchemaPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoRemoveRowSchemaPage(page, theme, bundle);
    await grid.goto();
  });

  test('restores a constructor row with a derived getter and keeps undo alive', async () => {
    await grid.removeRowViaContextMenu('getter', 1);
    await expect(grid.cell('getter', 1, 1)).toHaveText('1');

    await grid.undoWithKeyboard('getter');

    await expect(grid.cell('getter', 1, 0)).toHaveText('7');
    await expect(grid.cell('getter', 1, 1)).toHaveText('4');
    await expect(grid.cell('getter', 1, 2)).toHaveText('1');
    await expect(grid.cell('getter', 1, 3)).toHaveText('12');
    expect(grid.pageErrors).toEqual([]);
    expect(await grid.isUndoRecording('getter')).toBe(true);

    // A second cycle proves the plugin was not wedged by the first undo.
    await grid.removeRowViaContextMenu('getter', 0);
    await grid.undoWithKeyboard('getter');
    await expect(grid.cell('getter', 0, 3)).toHaveText('7');
  });

  test('restores an accessor-backed row through its column functions', async () => {
    await grid.removeRowViaContextMenu('accessor', 1);
    await expect(grid.cell('accessor', 1, 1)).toHaveText('Joan Well');

    await grid.undoWithKeyboard('accessor');

    await expect(grid.cell('accessor', 1, 0)).toHaveText('2');
    await expect(grid.cell('accessor', 1, 1)).toHaveText('Frank Honest');
    await expect(grid.cell('accessor', 1, 2)).toHaveText('B');
    expect(grid.pageErrors).toEqual([]);
    expect(await grid.rowCount('accessor')).toBe(await grid.sourceRowCount('accessor'));
    expect(await grid.isUndoRecording('accessor')).toBe(true);

    // A second cycle proves the accessor values keep coming back, not just once.
    await grid.removeRowViaContextMenu('accessor', 0);
    await expect(grid.cell('accessor', 0, 1)).toHaveText('Frank Honest');

    await grid.undoWithKeyboard('accessor');

    await expect(grid.cell('accessor', 0, 1)).toHaveText('Ted Right');
    await expect(grid.cell('accessor', 0, 2)).toHaveText('A');
    expect(grid.pageErrors).toEqual([]);
  });
});
