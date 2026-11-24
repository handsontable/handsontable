import { test, expect } from '../fixtures/test';
import {
  CONTEXT_MENU,
  DROPDOWN_MENU,
  ALIGNMENT_SUBMENU,
} from '../fixtures/pages/MenuSeparatorRolePage';
import { MenuItemPositionPage, type MenuRowPosition } from '../fixtures/pages/MenuItemPositionPage';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

/**
 * Menu items say where they are. Without `aria-posinset` and `aria-setsize` each browser counted a
 * menu's items its own way: NVDA with Firefox restarted the count after every separator, VoiceOver
 * with WebKit counted the separators as items. Every item now carries both, counted over the items
 * the menu draws: separators and the rows the Filters plugin hides are left out, a disabled item
 * still counts. Each menu is opened and walked with the keyboard only.
 */
test.describe('menu item position', () => {
  let menu: MenuItemPositionPage;

  /**
   * Assert that the items of one menu are numbered 1 to N in order, N being the number of items,
   * and that no separator carries a position.
   *
   * @param {MenuRowPosition[]} rows The rendered rows of one menu.
   * @returns {number} The number of items.
   */
  function expectNumberedInOrder(rows: MenuRowPosition[]): number {
    const items = rows.filter(row => !row.separator);
    const size = String(items.length);

    expect(items.length).toBeGreaterThan(0);
    expect(items.map(item => item.posinset)).toEqual(items.map((_, index) => String(index + 1)));
    expect(items.map(item => item.setsize)).toEqual(items.map(() => size));

    for (const separator of rows.filter(row => row.separator)) {
      expect(separator).toMatchObject({ role: 'separator', posinset: null, setsize: null });
    }

    return items.length;
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    menu = new MenuItemPositionPage(page, theme, bundle);
  });

  test('numbers the context menu items without its separators', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();

    const rows = await menu.positions(CONTEXT_MENU);

    expect(rows.some(row => row.separator)).toBe(true);
    expect(expectNumberedInOrder(rows)).toBe(rows.filter(row => !row.separator).length);
  });

  test('counts a disabled item', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();

    const disabled = menu.menu(CONTEXT_MENU).locator('td[aria-disabled="true"]').first();

    await expect(disabled).toHaveAttribute('aria-posinset', /^\d+$/);
    await expect(disabled).toHaveAttribute('aria-setsize', /^\d+$/);
  });

  test('counts on by one when the keyboard steps over a separator', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();

    const rows = await menu.positions(CONTEXT_MENU);
    const size = String(rows.filter(row => !row.separator).length);

    // "Insert row below" sits right above a separator in the default context menu.
    await menu.neighborBelowSeparator(CONTEXT_MENU, 'Insert row below');
    await menu.moveTo(CONTEXT_MENU, 'Insert row below');

    const before = Number(await menu.current(CONTEXT_MENU).getAttribute('aria-posinset'));

    await menu.nextItem(CONTEXT_MENU);

    await expect(menu.current(CONTEXT_MENU)).toHaveAttribute('aria-posinset', String(before + 1));
    await expect(menu.current(CONTEXT_MENU)).toHaveAttribute('aria-setsize', size);
  });

  test('numbers a submenu on its own', async() => {
    await menu.goto();
    await menu.openContextMenuByKeyboard();

    const parentSize = expectNumberedInOrder(await menu.positions(CONTEXT_MENU));

    await menu.openAlignmentSubmenuByKeyboard();

    const submenuSize = expectNumberedInOrder(await menu.positions(ALIGNMENT_SUBMENU));

    expect(submenuSize).not.toBe(parentSize);
  });

  test('numbers the column menu over the Filters rows it shows', async() => {
    await menu.goto();
    await menu.openDropdownMenuByKeyboard();

    const withoutOperators = expectNumberedInOrder(await menu.positions(DROPDOWN_MENU));

    await menu.page.keyboard.press('Escape');
    await expect(menu.menu(DROPDOWN_MENU)).toBeHidden();
    await menu.addBeginsWithCondition();
    await menu.openDropdownMenuByKeyboard();

    const withOperators = expectNumberedInOrder(await menu.positions(DROPDOWN_MENU));

    // "Begins with" shows the operators and the second condition, which "None" keeps hidden.
    expect(withOperators).toBe(withoutOperators + 2);
  });

  test('writes no position when `ariaTags` is off', async() => {
    await menu.goto(false);
    await menu.openContextMenuByKeyboard();

    const rows = await menu.positions(CONTEXT_MENU);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map(row => [row.posinset, row.setsize])).toEqual(rows.map(() => [null, null]));
  });
});

test.describe('sheets bar menu item position', () => {
  test('numbers the sheets of the All sheets menu', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ sheets: 4 });
    await fixture.allButton.focus();
    await page.keyboard.press('Enter');
    await expect(fixture.openMenu).toBeVisible();

    const items = fixture.openMenu.locator('td[role^="menuitem"]');

    await expect(items).toHaveCount(4);

    for (let index = 0; index < 4; index++) {
      await expect(items.nth(index)).toHaveAttribute('aria-posinset', String(index + 1));
      await expect(items.nth(index)).toHaveAttribute('aria-setsize', '4');
    }
  });
});
