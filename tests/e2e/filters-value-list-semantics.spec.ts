import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FiltersMenuKeyboardPage } from '../fixtures/pages/FiltersMenuKeyboardPage';

/**
 * The "Filter by value" list as a screen reader and a keyboard user reach it.
 *
 * The list is a nested Handsontable inside the column menu. Built with the grid's defaults it was an
 * unnamed `treegrid` whose rows read `Checked Alice`, whose checkboxes were all named `Checked`, and
 * whose focus sat on the table cell, so a reader entered a grid it could not leave for the other
 * menu controls. The list is a group of native checkboxes instead: the group is the "Filter by value"
 * section (named by its heading), each checkbox is named by its value, the focus lands on the
 * checkbox, and ArrowUp on the first value goes back to the search input it was entered from.
 */
test.describe('filters value list – a named group of checkboxes', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: FiltersMenuKeyboardPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersMenuKeyboardPage(page, theme, bundle);
  });

  test('each value is a checkbox named by its value, inside the "Filter by value" group', async() => {
    await grid.goto();
    await grid.openMenuWithKeyboard(0, 0);

    const group = grid.menu.getByRole('group', { name: 'Filter by value:', exact: true });

    for (const value of ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve']) {
      await expect(group.getByRole('checkbox', { name: value, exact: true })).toBeChecked();
    }

    // No grid semantics inside the section: no grid, row or cell a reader would enter as a table.
    for (const role of ['treegrid', 'grid', 'row', 'gridcell', 'table', 'cell'] as const) {
      await expect(group.getByRole(role), `no ${role} in the value list`).toHaveCount(0);
    }
  });

  test('the arrows move between the values, and ArrowUp on the first returns to the search input', async({ page }) => {
    await grid.goto();
    await grid.openMenuWithKeyboard(0, 0);
    await grid.pressTab(2);
    await expect(grid.searchInput).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Alice')).toBeFocused();

    for (const value of ['Bob', 'Charlie', 'Dave', 'Eve']) {
      await page.keyboard.press('ArrowDown');
      await expect(grid.listItem(value)).toBeFocused();
    }

    // The last value is the end of the list: ArrowDown does not wrap to the first one.
    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Eve')).toBeFocused();

    for (const value of ['Dave', 'Charlie', 'Bob', 'Alice']) {
      await page.keyboard.press('ArrowUp');
      await expect(grid.listItem(value)).toBeFocused();
    }

    // ArrowUp on the first value goes back where the list was entered from, and the list drops its
    // highlight, as it does when Tab leaves it.
    await page.keyboard.press('ArrowUp');
    await expect(grid.searchInput).toBeFocused();
    await expect(grid.focusedListItems()).toHaveCount(0);

    // From there Tab and Shift+Tab walk the menu as from any search input focus...
    await page.keyboard.press('Tab');
    await expect(grid.selectAllLink).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(grid.searchInput).toBeFocused();

    // ...and the way in still works.
    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Alice')).toBeFocused();
  });

  test('with the search hiding the first values, the arrows enter and leave on the first value shown', async({ page }) => {
    await grid.goto();
    // In the `'apply'` mode the search hides the values it does not match instead of reloading the list.
    await grid.updateSettings('{ filters: { searchMode: \'apply\' } }');
    await grid.openMenuWithKeyboard(0, 0);
    await grid.pressTab(2);
    await expect(grid.searchInput).toBeFocused();

    // "v" matches Dave and Eve only, so Alice, Bob and Charlie are hidden above them.
    await page.keyboard.type('v');
    await expect(grid.listItem('Alice')).toBeHidden();

    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Dave')).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(grid.searchInput).toBeFocused();
    await expect(grid.focusedListItems()).toHaveCount(0);
  });

  test('a scroll that redraws the list keeps the focus in it', async({ page }) => {
    await grid.goto();
    // Twenty values, so the list, a few rows tall on every theme, scrolls past the rows it has drawn.
    await grid.replaceData(Array.from({ length: 20 },
      (_, index) => [`Name ${String(index + 1).padStart(2, '0')}`, 'Blue']));
    await expect(grid.cell(0, 0)).toHaveText('Name 01');
    await grid.openMenuWithKeyboard(0, 0);
    await grid.pressTab(2);
    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Name 01')).toBeFocused();

    await grid.valueListHolder.hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => grid.valueListHolder.evaluate(holder => holder.scrollTop)).toBeGreaterThan(0);

    // The focused value is out of the drawn rows now, so the focus waits in the list, not on the body.
    await expect.poll(() => page.evaluate(() => (
      document.querySelector('.htUIMultipleSelectHot')?.contains(document.activeElement) ?? false
    ))).toBe(true);

    // And the next key goes on from the value it was on.
    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Name 02')).toBeFocused();
  });

  test('Space and a click toggle the value once, and OK filters by what is checked', async({ page }) => {
    await grid.goto();
    await grid.openMenuWithKeyboard(0, 0);
    await grid.pressTab(2);
    await page.keyboard.press('ArrowDown');
    await expect(grid.listItem('Alice')).toBeFocused();

    await page.keyboard.press('Space');
    await expect(grid.listItem('Alice')).not.toBeChecked();
    await expect(grid.listItem('Alice')).toBeFocused();

    // The native box is hidden under the theme's icon, so the pointer presses the value's label.
    await grid.valueLabels.filter({ hasText: /^Bob$/ }).click();
    await expect(grid.listItem('Bob')).not.toBeChecked();

    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['Charlie', 'Dave', 'Eve']);
  });

  test('with ariaTags off, the list writes no role and no name of its own', async() => {
    await grid.goto('aria=off');
    await grid.openMenuWithKeyboard(0, 0);

    const list = grid.menu.locator('.htUIMultipleSelectHot');

    await expect(list).not.toHaveAttribute('role');
    await expect(list.locator('[role]')).toHaveCount(0);
    await expect(list.locator('[aria-label]')).toHaveCount(0);
    // The native checkbox is still named by its label.
    await expect(grid.listItem('Alice')).toBeChecked();
  });
});
