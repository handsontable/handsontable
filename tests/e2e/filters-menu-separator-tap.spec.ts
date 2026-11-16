import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FiltersMenuKeyboardPage } from '../fixtures/pages/FiltersMenuKeyboardPage';

test.use({ hasTouch: true });

/**
 * A touch tap on a separator row of the filters dropdown menu.
 *
 * The separator row is 1px tall, so a mouse click or the arrow keys never select it, but the touch
 * hit-adjustment of a phone does. `dropdownMenu: true` builds its items as an array, which gives the
 * keyless separator its array index as the `key`, and the filters focus controller then called
 * `String#startsWith` on that number: `selectedItem.key.startsWith is not a function`, thrown from
 * the menu's `afterSelectionChange` hook before the controller cleared its focus state.
 */
test.describe('filters menu — touch tap on a separator', { tag: THEMES_TAG }, () => {
  let grid: FiltersMenuKeyboardPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersMenuKeyboardPage(page, theme, bundle);

    await grid.goto();
  });

  test('tapping a separator selects it and raises no error', async() => {
    await grid.openMenu('Name');
    await expect(grid.separatorRows.first()).toBeAttached();

    await grid.tapSeparator();

    // The tap has to land on the separator, or the hook that threw never runs and the test passes
    // without exercising it.
    await expect(grid.highlightedItem).toHaveClass(/htSeparator/);
    expect(grid.pageErrors).toEqual([]);
  });

  test('a tap on a separator hands the menu\'s keys back from the filter components', async({ page }) => {
    await grid.openMenu('Name');

    // Entering the components moves the focus navigator off its first stop, so a hook that fails to
    // clear it is told apart from one that does: the next Tab would then go on to the following stop
    // instead of starting the order again.
    await page.keyboard.press('Tab');
    await expect(grid.conditionSelect(0)).toBeFocused();

    await grid.tapSeparator();
    await expect(grid.highlightedItem).toHaveClass(/htSeparator/);

    await page.keyboard.press('Tab');
    await expect(grid.conditionSelect(0)).toBeFocused();
    expect(grid.pageErrors).toEqual([]);
  });
});
