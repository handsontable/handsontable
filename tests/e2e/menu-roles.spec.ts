import { test, expect, THEMES_TAG } from '../fixtures/test';
import { MenuRolesPage, type MenuOverlayAria } from '../fixtures/pages/MenuRolesPage';
import { CONTEXT_MENU, DROPDOWN_MENU, ALIGNMENT_SUBMENU } from '../fixtures/pages/MenuSeparatorRolePage';
import { FiltersConditionListViewportPage } from '../fixtures/pages/FiltersConditionListViewportPage';
import { MENU_SELECTOR } from '../fixtures/pages/MenuViewportClampPage';

/**
 * The context menu, the column menu, and their submenus are menus to assistive technology. A menu is
 * drawn as a Handsontable grid, so its items used to sit under a table row, a focusable scroll
 * container sat between the menu and its items, and the highlighted item carried `aria-selected`,
 * which a menu item does not support. With `ariaTags` on, the menu's own table markup is now
 * presentational, its scroll containers carry no `tabindex`, the menu has an accessible name, and the
 * highlighted item is the focused element and nothing more. Every menu is opened and walked with the
 * keyboard only.
 */
test.describe('menu roles', { tag: THEMES_TAG }, () => {
  let menu: MenuRolesPage;

  /**
   * Assert that the menu's own table markup is out of the accessibility tree: every overlay's table,
   * head, and body are presentational, every row is, and no scroll container carries a `tabindex`.
   *
   * @param {MenuOverlayAria[]} overlays The overlays of one menu.
   */
  function expectPresentationalTable(overlays: MenuOverlayAria[]): void {
    const master = overlays.filter(overlay => overlay.overlay === 'ht_master');

    expect(master).toHaveLength(1);
    expect(master[0].rows.length).toBeGreaterThan(0);
    expect(overlays.length).toBeGreaterThan(1);

    for (const overlay of overlays) {
      expect(overlay).toEqual({
        overlay: overlay.overlay,
        holderTabindex: null,
        table: 'presentation',
        thead: 'presentation',
        tbody: 'presentation',
        rows: overlay.rows.map(() => 'presentation'),
      });
    }
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    menu = new MenuRolesPage(page, theme, bundle);
  });

  test('exposes the context menu as a named menu that holds its items directly', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();

    const contextMenu = menu.menuNamed('Context menu');

    await expect(contextMenu).toBeVisible();
    await expect(contextMenu.getByRole('menuitem', { name: 'Insert row below', exact: true })).toBeVisible();
    await expect(contextMenu.getByRole('menuitemcheckbox', { name: 'Read only', exact: true })).toBeVisible();
    // The items are children of the menu in the accessibility tree: no table, row group, or row between.
    await expect(contextMenu).toMatchAriaSnapshot(`
      - menu "Context menu":
        - menuitem "Insert row above"
        - menuitem "Insert row below"
    `);
    await expect(contextMenu.getByRole('table')).toHaveCount(0);
    await expect(contextMenu.getByRole('rowgroup')).toHaveCount(0);
    await expect(contextMenu.getByRole('row')).toHaveCount(0);
    expectPresentationalTable(await menu.ownTableAria(CONTEXT_MENU));
  });

  test('keeps the focus on the highlighted item, which carries no `aria-selected`', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();
    await menu.page.keyboard.press('ArrowDown');

    const contextMenu = menu.menuNamed('Context menu');
    const highlighted = menu.highlightedItem(CONTEXT_MENU);

    await expect(highlighted).toHaveText('Insert row below');
    await expect(highlighted).toBeFocused();
    await expect(highlighted).toHaveAttribute('role', 'menuitem');
    await expect(highlighted).not.toHaveAttribute('aria-selected');
    await expect(contextMenu.locator('[aria-selected]')).toHaveCount(0);

    await menu.page.keyboard.press('ArrowUp');

    await expect(menu.highlightedItem(CONTEXT_MENU)).toHaveText('Insert row above');
    await expect(menu.highlightedItem(CONTEXT_MENU)).toBeFocused();
    await expect(contextMenu.locator('[aria-selected]')).toHaveCount(0);
  });

  test('names a submenu by the item that opens it', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();
    await menu.openAlignmentSubmenuByKeyboard();

    const submenu = menu.menuNamed('Alignment');

    await expect(submenu).toBeVisible();
    await expect(submenu.getByRole('menuitem', { name: 'Left', exact: true })).toBeVisible();
    await expect(submenu).toMatchAriaSnapshot(`
      - menu "Alignment":
        - menuitem "Left"
        - menuitem "Center"
    `);
    await expect(submenu.getByRole('row')).toHaveCount(0);
    await expect(menu.highlightedItem(ALIGNMENT_SUBMENU)).toBeFocused();
    await expect(submenu.locator('[aria-selected]')).toHaveCount(0);
    expectPresentationalTable(await menu.ownTableAria(ALIGNMENT_SUBMENU));
    // The parent stays a menu of its own while the submenu is open.
    await expect(menu.menuNamed('Context menu')).toBeVisible();
  });

  test('exposes the column menu as a named menu that holds its items directly', async() => {
    await menu.goto();
    await menu.openDropdownMenuByKeyboard();

    const columnMenu = menu.menuNamed('Column menu');

    await expect(columnMenu).toBeVisible();
    await expect(columnMenu.getByRole('menuitem', { name: 'Insert column left', exact: true })).toBeVisible();
    await expect(columnMenu).toMatchAriaSnapshot(`
      - menu "Column menu":
        - menuitem "Insert column left"
        - menuitem "Insert column right"
    `);
    await expect(columnMenu.getByRole('row')).toHaveCount(0);
    await expect(menu.highlightedItem(DROPDOWN_MENU)).toBeFocused();
    await expect(columnMenu.locator('[aria-selected]')).toHaveCount(0);
    expectPresentationalTable(await menu.ownTableAria(DROPDOWN_MENU));
  });

  test('moves the focus to the next cell on Tab from the context menu, never to a scroll container', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();
    await menu.page.keyboard.press('ArrowDown');
    await expect(menu.highlightedItem(CONTEXT_MENU)).toBeFocused();

    await menu.page.keyboard.press('Tab');

    await expect(menu.cell(1, 2)).toBeFocused();
    await expect(menu.focused()).not.toHaveClass(/\bwtHolder\b/);
    await expect(menu.container(CONTEXT_MENU)).toBeHidden();
  });

  test('moves the focus to the previous cell on Shift+Tab from the context menu', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();
    await menu.page.keyboard.press('ArrowDown');
    await expect(menu.highlightedItem(CONTEXT_MENU)).toBeFocused();

    await menu.page.keyboard.press('Shift+Tab');

    await expect(menu.cell(1, 0)).toBeFocused();
    await expect(menu.focused()).not.toHaveClass(/\bwtHolder\b/);
    await expect(menu.container(CONTEXT_MENU)).toBeHidden();
  });

  test('moves the focus to the next cell on Tab from a submenu and from the column menu', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();
    await menu.openAlignmentSubmenuByKeyboard();
    await expect(menu.highlightedItem(ALIGNMENT_SUBMENU)).toBeFocused();

    await menu.page.keyboard.press('Tab');

    await expect(menu.cell(1, 2)).toBeFocused();
    await expect(menu.container(ALIGNMENT_SUBMENU)).toBeHidden();
    await expect(menu.container(CONTEXT_MENU)).toBeHidden();

    await menu.openDropdownMenuByKeyboard();
    await expect(menu.highlightedItem(DROPDOWN_MENU)).toBeFocused();

    await menu.page.keyboard.press('Tab');

    // The column menu selects its column, so Tab leaves from the column's first cell.
    await expect(menu.cell(0, 2)).toBeFocused();
    await expect(menu.focused()).not.toHaveClass(/\bwtHolder\b/);
    await expect(menu.container(DROPDOWN_MENU)).toBeHidden();
  });

  test('writes no menu role, name, or presentational role when `ariaTags` is off', async() => {
    await menu.goto(false);
    await menu.openContextMenuByKeyboard();
    await menu.page.keyboard.press('ArrowDown');

    const container = menu.container(CONTEXT_MENU);
    const overlays = await menu.ownTableAria(CONTEXT_MENU);

    await expect(menu.highlightedItem(CONTEXT_MENU)).toHaveText('Insert row below');
    await expect(container).not.toHaveAttribute('role');
    await expect(container).not.toHaveAttribute('aria-label');
    await expect(container.locator('[aria-selected]')).toHaveCount(0);
    expect(overlays.length).toBeGreaterThan(1);
    expect(overlays.find(overlay => overlay.overlay === 'ht_master')?.rows.length).toBeGreaterThan(0);

    for (const overlay of overlays) {
      expect([overlay.table, overlay.thead, overlay.tbody, ...overlay.rows]).toEqual(
        [null, null, null, ...overlay.rows.map(() => null)]);
    }
  });
});

/**
 * A menu capped to the viewport scrolls in its own scroll container, and a scroll container with no
 * `tabindex` is a tab stop of its own in Chromium. The menu handles Tab itself while the focus is in
 * it, so a key press never reaches that stop. The fixture runs with `?page=locked` in a viewport
 * shorter than the Filters condition list, which is what caps the list. The list's height is a theme
 * token, so the spec runs on every theme and each test starts from the measured cap.
 */
test.describe('menu roles on a capped menu', { tag: THEMES_TAG }, () => {
  test.use({ viewport: { width: 800, height: 180 } });

  let grid: FiltersConditionListViewportPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersConditionListViewportPage(page, theme, bundle, 'ltr', 'locked');
    await grid.goto();
    await grid.openConditionList();

    const scroll = await grid.scrollState('conditions');

    // The precondition: the list is capped, so its scroll container really scrolls.
    expect(scroll.overflowY).toBe('auto');
    expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    await expect(grid.list().locator(':scope > .ht_master > .wtHolder')).not.toHaveAttribute('tabindex');
    await expect(grid.items().first()).toBeFocused();
  });

  test('moves the focus from the capped list to the next control of the column menu on Tab', async() => {
    await grid.page.keyboard.press('ArrowDown');
    await expect(grid.items().nth(1)).toBeFocused();

    await grid.page.keyboard.press('Tab');

    // "Is empty" takes no value, so the next control after the condition select is the OK button.
    await expect(grid.page.locator(`${MENU_SELECTOR.dropdown} .htFiltersMenuActionBar .htUIButtonOK input`))
      .toBeFocused();
    await expect(grid.page.locator(':focus')).not.toHaveClass(/\bwtHolder\b/);
    await expect(grid.items()).toHaveCount(0);
  });

  test('moves the focus from the capped list back to the column menu on Shift+Tab', async() => {
    await grid.page.keyboard.press('ArrowDown');
    await expect(grid.items().nth(1)).toBeFocused();

    await grid.page.keyboard.press('Shift+Tab');

    await expect(grid.menu('dropdown')).toBeFocused();
    await expect(grid.page.locator(':focus')).not.toHaveClass(/\bwtHolder\b/);
    await expect(grid.items()).toHaveCount(0);
  });
});
