import { test, expect } from '../fixtures/test';
import { MenuDuplicateNamesPage } from '../fixtures/pages/MenuDuplicateNamesPage';

/**
 * Custom menu items that share one string `name` must each get a row.
 *
 * The menu dropped an item whose `name` equaled the name of the item before it, when it meant to
 * drop a separator that followed another separator. Function names survived only because two
 * functions never compare equal, so the same three items rendered as one row or as three depending
 * on the type of `name`.
 */
test.describe('menu items that share one label', () => {
  let grid: MenuDuplicateNamesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new MenuDuplicateNamesPage(page, theme, bundle);
    await grid.goto();
  });

  test('renders every item when `contextMenu.items` is an object', async() => {
    await grid.build('context-object');

    expect(await grid.openContextMenuItems()).toEqual(['Name', 'Name', 'Name']);
  });

  test('renders every item when `contextMenu` is an array of item objects', async() => {
    await grid.build('context-array');

    expect(await grid.openContextMenuItems()).toEqual(['Name', 'Name', 'Name']);
  });

  test('renders every item when `dropdownMenu.items` is an object', async() => {
    await grid.build('dropdown-object');

    expect(await grid.openDropdownMenuItems()).toEqual(['Name', 'Name', 'Name']);
  });

  test('renders every item when the names are functions (the control)', async() => {
    // Without this case an unreadable menu would pass the three tests above for the wrong reason.
    await grid.build('context-function-names');

    expect(await grid.openContextMenuItems()).toEqual(['Name', 'Name', 'Name']);
  });
});
