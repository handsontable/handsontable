import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

/**
 * Undo of an autofill that starts from a merged area. The autofill copies the merge, so the undo
 * must remove the merges it created and keep the one it started from.
 */
test.describe('undo of an autofill of merged cells', () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
  });

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

  // DEV-520: the same for a merge declared in the settings.
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
