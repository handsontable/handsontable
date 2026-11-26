import { test, expect, THEMES_TAG } from '../fixtures/test';
import {
  MenuSeparatorRolePage,
  CONTEXT_MENU,
  DROPDOWN_MENU,
  ALIGNMENT_SUBMENU,
  type MenuRowAria,
} from '../fixtures/pages/MenuSeparatorRolePage';

/**
 * Menu separators are exposed as separators. A separator row used to be a `role="menuitem"` cell
 * named `---------`, so a screen reader listed a dashed item between the real ones. With `ariaTags`
 * on it is now a `role="separator"` cell with no name, no tab stop and no item states, while every
 * other row stays a named menu item. Each menu is opened and walked with the keyboard only, the way
 * a screen reader user reaches it.
 */
test.describe('menu separators', { tag: THEMES_TAG }, () => {
  let menu: MenuSeparatorRolePage;

  /**
   * Assert that every separator row is an unnamed separator and every other row a named item.
   *
   * @param {MenuRowAria[]} rows The rows of one menu.
   */
  function expectSeparatorsApart(rows: MenuRowAria[]): void {
    const separators = rows.filter(row => row.separator);
    const items = rows.filter(row => !row.separator);

    expect(separators.length).toBeGreaterThan(0);
    expect(items.length).toBeGreaterThan(0);

    for (const separator of separators) {
      expect(separator).toEqual({
        separator: true,
        text: '',
        role: 'separator',
        ariaLabel: null,
        tabindex: null,
        ariaDisabled: null,
        ariaExpanded: null,
        ariaChecked: null,
      });
    }

    for (const item of items) {
      expect(['menuitem', 'menuitemcheckbox']).toContain(item.role);
      expect(item.ariaLabel).toBe(item.text);
      expect(item.ariaLabel).not.toBe('');
      expect(item.tabindex).toBe(item.ariaDisabled === 'true' ? null : '-1');
    }

    expect(items.filter(item => item.tabindex === '-1').length).toBeGreaterThan(0);
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    menu = new MenuSeparatorRolePage(page, theme, bundle);
  });

  test('exposes the context menu separators as unnamed separators', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();

    const rows = await menu.rows(CONTEXT_MENU);
    const contextMenu = menu.menu(CONTEXT_MENU);

    expectSeparatorsApart(rows);
    await expect(contextMenu.getByRole('separator')).toHaveCount(rows.filter(row => row.separator).length);
    await expect(contextMenu.getByRole('menuitem', { name: 'Insert row below', exact: true })).toBeVisible();
    await expect(contextMenu.getByRole('menuitem', { name: '---------' })).toHaveCount(0);
  });

  test('moves the keyboard selection over a separator in both directions', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();

    const below = await menu.neighborBelowSeparator(CONTEXT_MENU, 'Insert row below');

    await menu.moveTo(CONTEXT_MENU, 'Insert row below');
    await menu.page.keyboard.press('ArrowDown');

    await expect(menu.highlightedItem(CONTEXT_MENU)).toHaveText(below);
    await expect(menu.highlightedItem(CONTEXT_MENU)).toHaveAttribute('aria-label', below);

    await menu.page.keyboard.press('ArrowUp');

    await expect(menu.highlightedItem(CONTEXT_MENU)).toHaveText('Insert row below');
    await expect(menu.highlightedItem(CONTEXT_MENU)).toHaveAttribute('role', 'menuitem');
  });

  test('exposes the Alignment submenu separator as an unnamed separator', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();
    await menu.openAlignmentSubmenuByKeyboard();

    const rows = await menu.rows(ALIGNMENT_SUBMENU);

    expectSeparatorsApart(rows);
    expect(rows.filter(row => row.separator)).toHaveLength(1);
    await expect(menu.menu(ALIGNMENT_SUBMENU).getByRole('separator')).toHaveCount(1);
  });

  test('exposes the column menu separators as unnamed separators', async() => {
    await menu.goto();
    await menu.openDropdownMenuByKeyboard();

    const rows = await menu.rows(DROPDOWN_MENU);

    expectSeparatorsApart(rows);
    await expect(menu.menu(DROPDOWN_MENU).getByRole('separator')).toHaveCount(rows.filter(row => row.separator).length);
  });

  test('writes no role on a separator when `ariaTags` is off', async() => {
    await menu.goto(false);
    await menu.openContextMenuByKeyboard();

    const rows = await menu.rows(CONTEXT_MENU);
    const separators = rows.filter(row => row.separator);

    expect(separators.length).toBeGreaterThan(0);
    expect(separators.map(row => [row.role, row.ariaLabel])).toEqual(separators.map(() => [null, null]));
    expect(rows.filter(row => !row.separator).map(row => row.role)).toEqual(
      rows.filter(row => !row.separator).map(() => null));
  });
});
