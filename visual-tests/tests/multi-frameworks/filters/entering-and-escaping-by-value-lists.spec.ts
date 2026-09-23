import { visualTest, expect, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks whether entering the "by value" list component (ArrowDown) and escaping it (Tab or
 * Shift+Tab) moves the focus correctly: each capture shows which component of the filters dropdown
 * holds the focus after one move. Owned by DEV-2981, which folds this spec's seven captures into the
 * filters consolidation.
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
  // A value-list cell is named by its checkbox state and its value, so this also pins what SPACE and
  // ENTER did: both unticked the cell they were pressed on, and the focus stayed on the second one.
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
