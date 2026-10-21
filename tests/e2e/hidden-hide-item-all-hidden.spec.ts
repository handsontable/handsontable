import { test, expect } from '../fixtures/test';
import { HiddenHideContextMenuPage } from '../fixtures/pages/HiddenHideContextMenuPage';

/**
 * DEV-164. Right-clicking the top-left corner selects the whole table, and on that selection the
 * HiddenRows / HiddenColumns plugins kept showing "Hide rows" / "Hide columns" even when no row /
 * column was rendered - a menu entry that runs `hideRows([])` / `hideColumns([])` and hides nothing.
 *
 * Each item's `hidden()` now suppresses itself whenever no row / column is rendered
 * (`getRenderableIndexesLength() === 0`): every row/column hidden (the reported case), an empty
 * grid, or a fully-trimmed grid are all the same dead entry. The "still appears" cases pin the
 * other half - the item must stay whenever there IS something to hide.
 */
test.describe('Hide rows / Hide columns context-menu item on a corner select-all (DEV-164)', () => {
  let menu: HiddenHideContextMenuPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    menu = new HiddenHideContextMenuPage(page, theme, bundle);

    await menu.goto();
  });

  test.describe('Hide rows', () => {
    test('is hidden when every row is already hidden', async () => {
      await menu.hideRows([0, 1, 2, 3, 4]);
      await menu.openCornerMenu();

      await expect(menu.item(/^Hide rows?$/)).toHaveCount(0);
      // Precondition: "Show rows" is present only on a corner selection with rows actually hidden,
      // so it proves the menu opened on that state - without it, a 0 above could mean the corner
      // selection was lost and the first gate hid the item for an unrelated reason.
      await expect(menu.item(/^Show rows?$/)).toHaveCount(1);
    });

    test('still appears when only some rows are hidden', async () => {
      await menu.hideRows([0, 1]);
      await menu.openCornerMenu();

      await expect(menu.item(/^Hide rows?$/)).toHaveCount(1);
    });

    test('still appears when no rows are hidden', async () => {
      await menu.openCornerMenu();

      await expect(menu.item(/^Hide rows?$/)).toHaveCount(1);
    });

    // A fully-trimmed grid renders no rows either, so the item is equally dead and is suppressed.
    // "Hide columns" stays (columns are still rendered), which also proves the corner selection is
    // live - the item could not appear otherwise.
    test('is hidden when every row is trimmed away', async () => {
      await menu.trimRows([0, 1, 2, 3, 4]);
      await menu.openCornerMenu();

      await expect(menu.item(/^Hide rows?$/)).toHaveCount(0);
      await expect(menu.item(/^Hide columns?$/)).toHaveCount(1);
    });

    // The non-corner path: a plain row-header selection (isSelectedByRowHeader), with some rows
    // hidden and the selected one still visible. The all-hidden case is unreachable this way - a
    // hidden row has no header to right-click - so the corner tests own that state.
    test('still appears on a row-header selection with some rows hidden', async () => {
      await menu.hideRows([0, 1]);
      await menu.openRowHeaderMenu(2);

      await expect(menu.item(/^Hide rows?$/)).toHaveCount(1);
    });
  });

  test.describe('Hide columns', () => {
    test('is hidden when every column is already hidden', async () => {
      await menu.hideColumns([0, 1, 2, 3, 4]);
      await menu.openCornerMenu();

      await expect(menu.item(/^Hide columns?$/)).toHaveCount(0);
      await expect(menu.item(/^Show columns?$/)).toHaveCount(1);
    });

    test('still appears when only some columns are hidden', async () => {
      await menu.hideColumns([0, 1]);
      await menu.openCornerMenu();

      await expect(menu.item(/^Hide columns?$/)).toHaveCount(1);
    });

    test('still appears when no columns are hidden', async () => {
      await menu.openCornerMenu();

      await expect(menu.item(/^Hide columns?$/)).toHaveCount(1);
    });

    // The non-corner path: a plain column-header selection (isSelectedByColumnHeader). There is no
    // built-in column-trimming plugin, so the empty-grid test below is what covers the column axis'
    // "rendered count is 0 but nothing hidden" state.
    test('still appears on a column-header selection with some columns hidden', async () => {
      await menu.hideColumns([0, 1]);
      await menu.openColumnHeaderMenu(2);

      await expect(menu.item(/^Hide columns?$/)).toHaveCount(1);
    });
  });

  // An empty grid renders no rows AND no columns, with nothing hidden - both items are the same
  // dead entry and are suppressed. `isCornerSelected()` is the precondition here (there is no Hide
  // or Show item left to witness the corner selection with).
  test('both items are hidden on an empty grid', async () => {
    await menu.loadEmpty();
    await menu.openCornerMenu();

    expect(await menu.isCornerSelected()).toBe(true);
    await expect(menu.item(/^Hide rows?$/)).toHaveCount(0);
    await expect(menu.item(/^Hide columns?$/)).toHaveCount(0);
  });
});
