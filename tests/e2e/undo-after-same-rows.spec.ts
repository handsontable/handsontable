import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { GridLayoutsPage } from '../fixtures/pages/GridLayoutsPage';

/**
 * A wrapper passes `data` again on every render. When the rows are the ones the grid already holds, in the
 * same array or in a copy of it, nothing was replaced, so an edit made before the render can still be
 * undone with the keyboard. A render that brings rows with other values replaces the dataset, and the
 * history goes with it.
 */
test.describe('undo after the grid is passed its own rows again', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: GridLayoutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new GridLayoutsPage(page, theme, bundle);
    await grid.goto('nested-headers');
  });

  for (const how of ['same-array', 'copy'] as const) {
    test(`undoes an edit with the keyboard after \`data\` is passed again as the ${how}`, async() => {
      const original = await grid.dataAt(2, 2);
      const before = await grid.data();

      await grid.editCell(2, 2, 'test');
      await grid.passRowsAgain(how);

      expect(await grid.dataAt(2, 2)).toBe('test');
      await expect(grid.cell(2, 2)).toHaveText('test');

      await grid.undoWithKeyboard();

      await expect(grid.cell(2, 2)).toHaveText(String(original));
      expect(await grid.data()).toEqual(before);

      await grid.redoWithKeyboard();

      await expect(grid.cell(2, 2)).toHaveText('test');
    });
  }

  test('drops the history when `data` brings other values', async() => {
    await grid.editCell(2, 2, 'test');

    // New row arrays, and the edited cell holds another value than the grid shows: a reload.
    const reloaded = (await grid.data()).map(row => row.slice());

    reloaded[2][2] = 'other';
    await grid.updateSettings({ data: reloaded });

    await grid.undoWithKeyboard();

    // A kept history would have written the value from before the edit back.
    expect(await grid.dataAt(2, 2)).toBe('other');
  });
});
