import { test, expect } from '../fixtures/test';
import { CellsReadOnlyPage } from '../fixtures/pages/CellsReadOnlyPage';

/**
 * DEV-149. A `readOnly` set by the `cells` option is evaluated again on top of every stored value,
 * so the "Read only" menu item can never change it. It still counted as "at least one read-only"
 * in the direction check, so a column holding such a cell always resolved to "make writable" and
 * could never be made read-only from the menu.
 *
 * Product decision: the item acts on the cells `cells()` has no opinion about, and its check mark
 * reflects only those. A selection made only of cells `cells()` owns keeps the behavior it always
 * had, so a grid whose `cells()` sets `readOnly` on every cell does not lose the item.
 *
 * `getCellMeta()` runs `cells()` again on every read, so it cannot show what the menu stored. The
 * specs that must prove "the menu did not touch this cell" read the recorded `afterSetCellMeta`
 * writes instead.
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

  test('stores nothing for a cell that cells() pins writable', async () => {
    await grid.forgetReadOnlyWrites();
    await grid.openContextMenuOnHeader(1);
    await grid.clickReadOnlyItem();

    // Row 0 is read-only by `cells()` and row 2 is pinned writable by it, so neither is written.
    expect(await grid.columnReadOnly(1)).toEqual([true, true, false, true, true]);
    expect(await grid.readOnlyWrites()).toEqual([[1, 1], [3, 1], [4, 1]]);
  });

  test('recognizes a readOnly that cells() assigns to this', async () => {
    await grid.forgetReadOnlyWrites();
    await grid.openContextMenuOnHeader(2);
    await grid.clickReadOnlyItem();

    // Row 3 is pinned writable through `this.readOnly = false`, and the function returns nothing.
    expect(await grid.columnReadOnly(2)).toEqual([true, true, true, false, true]);
    expect(await grid.readOnlyWrites()).toEqual([[1, 2], [2, 2], [4, 2]]);
  });

  test('hands cells() physical indexes after a row was moved', async () => {
    // Physical row 0 is the one `cells()` makes read-only. Moving it to visual row 3 splits the two
    // index spaces, so a menu that passed visual indexes would lock visual row 0 instead.
    await grid.moveRow(0, 3);
    await grid.forgetReadOnlyWrites();
    await grid.openContextMenuOnHeader(0);
    await grid.clickReadOnlyItem();

    expect(await grid.readOnlyWrites()).toEqual([[0, 0], [1, 0], [2, 0], [4, 0]]);
  });

  test('keeps the item for a selection made only of cells() read-only cells', async () => {
    // Positive control first: on a plain cell the item is there.
    await grid.openContextMenuOnCell(1, 0);

    expect(await grid.visibleItems()).toContain('Read only');

    await grid.closeMenu();
    await grid.openContextMenuOnCell(0, 0);

    // Nothing else is selected, so the item behaves as it did before: it is there and shows the
    // cell's real state. Clicking it cannot change a cell that `cells()` owns.
    expect(await grid.visibleItems()).toContain('Read only');
    expect(await grid.readOnlyItemChecked()).toBe('true');

    await grid.clickReadOnlyItem();

    expect(await grid.readOnly(0, 0)).toBe(true);
  });

  test('restores the other cells on undo, and toggles them again on redo', async () => {
    await grid.openContextMenuOnHeader(0);
    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);

    await grid.undoWithKeyboard();

    expect(await grid.columnReadOnly(0)).toEqual([true, false, false, false, false]);

    await grid.redo();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);
  });
});
