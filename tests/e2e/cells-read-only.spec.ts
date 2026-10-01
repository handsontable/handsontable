import { test, expect } from '../fixtures/test';
import { CellsReadOnlyPage } from '../fixtures/pages/CellsReadOnlyPage';

/**
 * DEV-149. A `readOnly` returned by the `cells` option is evaluated again on top of every stored
 * value, so the "Read only" menu item can never change it. It still counted as "at least one
 * read-only" in the direction check, so a column holding such a cell always resolved to "make
 * writable" and could never be made read-only from the menu.
 *
 * Product decision: the item acts on the cells `cells()` has no opinion about, and its check mark
 * reflects only those. On a selection made only of cells `cells()` owns, the item does not appear.
 */
test.describe('cells() read-only lock', () => {
  let grid: CellsReadOnlyPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new CellsReadOnlyPage(page, theme, bundle);
    await grid.goto();
  });

  test('makes a column read-only around a cells()-owned read-only cell, and back', async () => {
    await grid.openContextMenuOnHeader(0);

    // Row 0 is read-only through `cells()` and does not count towards the mark.
    expect(await grid.readOnlyItemChecked()).toBe('false');

    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);

    await grid.openContextMenuOnHeader(0);

    expect(await grid.readOnlyItemChecked()).toBe('true');

    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([true, false, false, false, false]);
  });

  test('works the same from the column menu', async () => {
    await grid.openColumnMenu(0);
    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);
  });

  test('leaves a cell that cells() pins writable alone', async () => {
    await grid.openContextMenuOnHeader(1);
    await grid.clickReadOnlyItem();

    // Row 0 is read-only by `cells()`, row 2 is pinned writable by it, the rest are toggled.
    expect(await grid.columnReadOnly(1)).toEqual([true, true, false, true, true]);
  });

  test('hides "Read only" on a selection made only of cells() read-only cells', async () => {
    // Positive control first: on a plain cell the item is there.
    await grid.openContextMenuOnCell(1, 0);

    expect(await grid.visibleItems()).toContain('Read only');

    await grid.closeMenu();
    await grid.openContextMenuOnCell(0, 0);

    expect(await grid.visibleItems()).not.toContain('Read only');
    expect(await grid.readOnly(0, 0)).toBe(true);
  });

  test('undoes a column toggle without touching the cells() read-only cell', async () => {
    await grid.openContextMenuOnHeader(0);
    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);

    await grid.undoWithKeyboard();

    expect(await grid.columnReadOnly(0)).toEqual([true, false, false, false, false]);

    await grid.redo();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);
  });
});
