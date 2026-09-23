import { visualTest, expect, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks whether entering the "by value" list component (ArrowDown) and escaping it (Tab or Shift+Tab)
 * moves the focus correctly. Each capture shows which component holds the focus: the search input, a
 * value-list cell (after SPACE and ENTER unticked 1/10/20 and 1/22/20), the Clear link, the Select all
 * link, the search input again, the list again (1/10/20 ticked back), and the OK button. Owned by DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  // Every capture waits for the focus state it photographs; see escaping-the-menu.spec.ts for why the
  // locators hang off one menu root.
  const menu = tablePage.locator(helpers.selectors.dropdownMenu);
  const searchInput = menu.getByPlaceholder('Search', { exact: true });
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(searchInput).toBeFocused();

  // take a screenshot of the dropdown menu where the search input is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Space');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter');
  // A value-list cell is named by its checkbox state and its value, so this also pins what ENTER did: it
  // unticked "1/22/20" and left the focus there. What SPACE did to "1/10/20" is pinned further down,
  // where ENTER ticks it back.
  await expect(menu.getByRole('gridcell', { name: 'Unchecked 1/22/20', exact: true })).toBeFocused();

  // take a screenshot of the focused "by value" component
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await expect(menu.locator('.htUIClearAll a')).toBeFocused();

  // take a screenshot of the focused "Clear" link element
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await expect(menu.locator('.htUISelectAll a')).toBeFocused();

  // take a screenshot of the focused "Select all" link element
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Shift+Tab');
  await expect(searchInput).toBeFocused();

  // take a screenshot of the focused search input element
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter');
  await expect(menu.getByRole('gridcell', { name: 'Checked 1/10/20', exact: true })).toBeFocused();

  // take a screenshot of the focused "by value" component
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUIButtonOK input')).toBeFocused();

  // take a screenshot of the focused "Ok" button
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
