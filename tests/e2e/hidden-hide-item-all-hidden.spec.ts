import { test, expect } from '../fixtures/test';
import { HiddenHideContextMenuPage } from '../fixtures/pages/HiddenHideContextMenuPage';

/**
 * DEV-164. Right-clicking the top-left corner selects the whole table, and on that selection the
 * HiddenRows / HiddenColumns plugins kept showing "Hide rows" / "Hide columns" even when every
 * row / column was already hidden - a menu entry with nothing left to act on.
 *
 * Each item's `hidden()` now also suppresses itself when there are no renderable indexes left AND
 * this plugin actually hid some. The two regression cases below (some hidden, none hidden) pin the
 * other half: the item must still appear whenever there IS something to hide, including the corner
 * select-all it always supported.
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

      expect(await menu.matchingItemCount('hide row')).toBe(0);
    });

    test('still appears when only some rows are hidden', async () => {
      await menu.hideRows([0, 1]);
      await menu.openCornerMenu();

      expect(await menu.matchingItemCount('hide row')).toBe(1);
    });

    test('still appears when no rows are hidden', async () => {
      await menu.openCornerMenu();

      expect(await menu.matchingItemCount('hide row')).toBe(1);
    });

    // Pins the second clause of hidden(): renderable rows are 0 here too, but the HiddenRows
    // plugin has hidden none of them (they are trimmed), so the item must stay. Without the
    // `getHiddenRows().length > 0` guard this reads 0 and the test fails - the empty/trimmed grid
    // is where the naive `renderable === 0` form would change behavior.
    test('still appears when every row is only trimmed, not hidden', async () => {
      await menu.trimRows([0, 1, 2, 3, 4]);
      await menu.openCornerMenu();

      expect(await menu.matchingItemCount('hide row')).toBe(1);
    });
  });

  test.describe('Hide columns', () => {
    test('is hidden when every column is already hidden', async () => {
      await menu.hideColumns([0, 1, 2, 3, 4]);
      await menu.openCornerMenu();

      expect(await menu.matchingItemCount('hide column')).toBe(0);
    });

    test('still appears when only some columns are hidden', async () => {
      await menu.hideColumns([0, 1]);
      await menu.openCornerMenu();

      expect(await menu.matchingItemCount('hide column')).toBe(1);
    });

    test('still appears when no columns are hidden', async () => {
      await menu.openCornerMenu();

      expect(await menu.matchingItemCount('hide column')).toBe(1);
    });

  });

  // An empty grid has 0 renderable rows AND 0 renderable columns, yet neither plugin has hidden
  // anything - so both Hide items must stay. This pins the `getHidden*().length > 0` clause on both
  // axes at once: the naive `renderable === 0` form would hide both items here.
  test('both items still appear on an empty grid (nothing hidden)', async () => {
    await menu.loadEmpty();
    await menu.openCornerMenu();

    expect(await menu.matchingItemCount('hide row')).toBe(1);
    expect(await menu.matchingItemCount('hide column')).toBe(1);
  });
});
