import { test, expect } from '../fixtures/test';
import { MenuFocusReturnPage, CONTEXT_MENU } from '../fixtures/pages/MenuFocusReturnPage';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';

/**
 * The focus catchers are the two hidden tab stops around a grid that detect a Tab coming from above or
 * from below. They are bare `div`s with no role on purpose, so a screen reader does not announce them,
 * and the audit reports an armed one as a focus stop with no role (WCAG 4.1.2).
 *
 * While a menu holds the focus, the grid's scope is inactive, which armed its catchers. A Tab inside a
 * menu never reaches them: the menu's own shortcut moves the selection and closes the menu. So an armed
 * catcher there is a stop nobody can reach, and the audit finds it on every menu page. The catchers are
 * disarmed while the focus is in a menu and armed again once it leaves.
 */
test.describe('focus catchers while a menu holds the focus', () => {
  let menu: MenuFocusReturnPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    menu = new MenuFocusReturnPage(page, theme, bundle);

    await menu.goto();
  });

  test('the catchers are armed while the focus is outside the grid (control)', async() => {
    await menu.selectCellAt(1, 1);
    await menu.outside.focus();

    await expect(menu.armedFocusCatchers).not.toHaveCount(0);
  });

  test('the catchers are not tab stops while the context menu holds the focus', async() => {
    await menu.openContextMenuAt(1, 1);

    await expect(menu.armedFocusCatchers).toHaveCount(0);
  });

  test('the catchers are not tab stops while the column menu holds the focus', async() => {
    await menu.openDropdownMenuAt(1, 1);

    await expect(menu.armedFocusCatchers).toHaveCount(0);
  });

  test('the catchers are not tab stops while a menu opened with the mouse holds the focus', async() => {
    await menu.openContextMenuByMouse(1, 1);

    await expect(menu.menu(CONTEXT_MENU)).toBeVisible();
    await expect(menu.armedFocusCatchers).toHaveCount(0);
  });

  test('the catchers arm again when the menu closes on a click outside every focus scope', async() => {
    await menu.openContextMenuAt(1, 1);
    await expect(menu.armedFocusCatchers).toHaveCount(0);

    // The page's margin is neither focusable nor inside a scope: the menu closes and the focus falls to the
    // document, where a Tab from the browser UI would meet the catchers.
    await menu.page.mouse.click(2, 2);

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.armedFocusCatchers).not.toHaveCount(0);
  });

  // The two cases below pin what the cell keeps after Escape; they guard a regression and are not what
  // proves the change, which the open-menu cases above are.
  test('Escape returns the focus to the cell and leaves the catchers disarmed', async() => {
    await menu.openContextMenuAt(1, 1);
    await menu.page.keyboard.press('Escape');

    await expect(menu.menu(CONTEXT_MENU)).toBeHidden();
    await expect(menu.cell(1, 1)).toBeFocused();
    await expect(menu.armedFocusCatchers).toHaveCount(0);
  });

  test('the catchers are not tab stops while a submenu holds the focus', async() => {
    await menu.openContextMenuAt(1, 1);
    await menu.openAlignmentSubmenuByKeyboard();

    await expect(menu.armedFocusCatchers).toHaveCount(0);
  });

  test('a menu closed through the API, with neither a focus event nor a click, leaves the catchers armed', async() => {
    await menu.openAndCloseContextMenuThroughApi();

    await expect(menu.armedFocusCatchers).not.toHaveCount(0);
  });

  test('a menu of one grid leaves the catchers of another grid on the page armed', async() => {
    const second = await menu.buildSecondGrid();
    const secondCatchers = second.locator('.htFocusCatcher[tabindex="0"]');

    await menu.openContextMenuAt(1, 1);

    await expect(menu.page.getByTestId('grid').locator('.htFocusCatcher[tabindex="0"]')).toHaveCount(0);
    await expect(secondCatchers).toHaveCount(2);
  });

  test('the catchers arm again when the focus leaves the grid after the menu closed', async() => {
    await menu.openContextMenuAt(1, 1);
    await menu.page.keyboard.press('Escape');
    await expect(menu.cell(1, 1)).toBeFocused();

    await menu.outside.focus();

    await expect(menu.armedFocusCatchers).not.toHaveCount(0);
  });
});

test.describe('focus catchers while the sheets bar menu holds the focus', () => {
  test('are not tab stops', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();
    await fixture.chevron(0).click();
    await expect(fixture.openMenu).toBeVisible();

    await expect(page.locator('.htFocusCatcher[tabindex="0"]')).toHaveCount(0);
  });
});
