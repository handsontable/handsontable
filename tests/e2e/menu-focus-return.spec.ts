import { test, expect } from '../fixtures/test';
import { MenuFocusReturnPage, CONTEXT_MENU, DROPDOWN_MENU } from '../fixtures/pages/MenuFocusReturnPage';

/**
 * The context menu and the column menu close with the keyboard, and the focus has to land back on the
 * cell the menu was opened from (WCAG 2.4.3). A menu is a grid of its own, and closing it destroys
 * that grid together with the element that held the focus, so the browser drops the focus to the
 * document. A screen reader then announces the page, and a keyboard user loses their place until
 * the next key press. The cases open the menu and close it with keys, the way a screen reader user
 * does, and assert the focused element with `toBeFocused()`. Enter and Space run an item that leaves
 * the focus on the document without the fix ("Insert row below", "Insert column right"): items such as
 * "Insert row above" re-render the cell and focus it anyway. The last cases prove what the return
 * must leave alone: a focus the browser, a menu command or an application puts elsewhere.
 */
test.describe('focus after a menu closes', () => {
  let menu: MenuFocusReturnPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    menu = new MenuFocusReturnPage(page, theme, bundle);

    await menu.goto();
  });

  test('Escape on the context menu returns the focus to the cell and changes nothing else', async() => {
    await menu.openContextMenuAt(1, 1);
    await menu.page.keyboard.press('Escape');

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.cell(1, 1)).toBeFocused();
    // The grid's own Escape handler must not run on the same key press: the selection stays and no
    // editor opens or closes.
    expect(await menu.selection()).toEqual([1, 1, 1, 1]);
    expect(await menu.editorOpened()).toBe(false);
  });

  test('Enter on a context menu item that re-renders nothing returns the focus to the selected cell', async() => {
    await menu.openContextMenuAt(5, 5);
    await menu.moveTo(CONTEXT_MENU, 'Insert row below');
    await menu.page.keyboard.press('Enter');

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.highlightedCell).toBeFocused();
  });

  test('Escape on the column menu returns the focus to the cell', async() => {
    await menu.openDropdownMenuAt(1, 1);
    await menu.page.keyboard.press('Escape');

    await expect(menu.menu(DROPDOWN_MENU)).toBeHidden();
    // Opening the column menu selects the whole column, so the focus follows the highlighted cell.
    await expect(menu.highlightedCell).toBeFocused();
  });

  for (const key of ['Enter', 'Space']) {
    test(`${key} on a column menu item returns the focus to the selected cell`, async() => {
      await menu.openDropdownMenuAt(5, 5);
      await menu.moveTo(DROPDOWN_MENU, 'Insert column right');
      await menu.page.keyboard.press(key);

      await expect(menu.menu(DROPDOWN_MENU)).toBeHidden();
      await expect(menu.highlightedCell).toBeFocused();
    });
  }

  test('ArrowLeft in a submenu returns the focus to its row in the parent menu, and Escape then to the cell', async() => {
    await menu.openContextMenuAt(1, 1);
    await menu.openAlignmentSubmenuByKeyboard();
    await menu.page.keyboard.press('ArrowLeft');

    await expect(menu.menu('.htContextMenuSub_Alignment')).toBeHidden();
    await expect(menu.highlightedItem(CONTEXT_MENU)).toBeFocused();
    await expect(menu.highlightedItem(CONTEXT_MENU)).toHaveText('Alignment');

    await menu.page.keyboard.press('Escape');

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.cell(1, 1)).toBeFocused();
  });

  test('Escape on a context menu opened with the mouse returns the focus to the cell', async() => {
    await menu.openContextMenuByMouse(2, 2);
    await menu.page.keyboard.press('Escape');

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.cell(2, 2)).toBeFocused();
  });

  test('Escape on a column menu opened with the mouse returns the focus to the highlighted cell', async() => {
    await menu.openDropdownMenuByMouse(1);
    await menu.page.keyboard.press('Escape');

    await expect(menu.menu(DROPDOWN_MENU)).toBeHidden();
    await expect(menu.highlightedCell).toBeFocused();
  });

  test('Escape in a submenu returns the focus to its row in the parent menu', async() => {
    await menu.openContextMenuAt(1, 1);
    await menu.openAlignmentSubmenuByKeyboard();
    await menu.page.keyboard.press('Escape');

    await expect(menu.menu('.htContextMenuSub_Alignment')).toBeHidden();
    await expect(menu.menu(CONTEXT_MENU)).toBeVisible();
    await expect(menu.highlightedItem(CONTEXT_MENU)).toBeFocused();
    await expect(menu.highlightedItem(CONTEXT_MENU)).toHaveText('Alignment');
  });

  test('a menu command that moves the focus keeps it there', async() => {
    await menu.openContextMenuAt(1, 1);
    await menu.moveTo(CONTEXT_MENU, 'Focus outside');
    await menu.page.keyboard.press('Enter');

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.outside).toBeFocused();
  });

  test('a click on a field outside the grid keeps the focus on that field', async() => {
    await menu.openContextMenuAt(1, 1);
    await menu.outside.click();

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.outside).toBeFocused();
  });

  test('a listener of the hide hook finds the focus on the cell', async() => {
    await menu.recordFocusAtContextMenuHide();
    await menu.openContextMenuAt(1, 1);
    await menu.page.keyboard.press('Escape');

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect.poll(() => menu.focusAtContextMenuHide()).toBe('cell-1-1');
  });

  test('a listener of the hide hook that moves the focus keeps it', async() => {
    await menu.focusOutsideAfterContextMenuHide();
    await menu.openContextMenuAt(1, 1);
    await menu.page.keyboard.press('Escape');

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.outside).toBeFocused();
  });
});
