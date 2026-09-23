import { visualTest, expect, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks whether pressing the ESCAPE key within any focused component closes the menu: each open
 * capture shows one component of the filters dropdown focused, and the capture after it shows the grid
 * with the menu gone. Owned by DEV-2981, which folds this spec's sixteen captures into the filters
 * consolidation.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  // Every capture waits for the focus state it photographs. A capture straight after a key press
  // photographs whichever half of the focus move the runner reached, and this family is where that
  // was measured (see CAPTURE_RESTRICTIONS in visual-tests/.eslintrc.js). The in-menu locators hang off
  // one root, so a wrong root fails their focus checks instead of letting `toBeHidden()` pass on an
  // element that never existed.
  const menu = tablePage.locator(helpers.selectors.dropdownMenu);
  const conditionSelect = menu.getByRole('menuitem').filter({ hasText: 'Filter by condition' })
    .getByRole('listbox');
  const searchInput = menu.getByPlaceholder('Search', { exact: true });
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await tablePage.keyboard.press('Tab');
  await expect(conditionSelect).toBeFocused();

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(searchInput).toBeFocused();

  // take a screenshot of the dropdown menu where the search input is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter');
  // A value-list cell is named by its checkbox state and its value, so this also pins what ENTER did:
  // it unticked "1/13/20" and left the focus there.
  await expect(menu.getByRole('gridcell', { name: 'Unchecked 1/13/20', exact: true })).toBeFocused();

  // take a screenshot of the dropdown menu where the list (handsontable) is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUISelectAll a')).toBeFocused();

  // take a screenshot of the dropdown menu where the "Select all" link is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUIClearAll a')).toBeFocused();

  // take a screenshot of the dropdown menu where the "Clear" link is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUIButtonOK input')).toBeFocused();

  // take a screenshot of the dropdown menu where the "Ok" button is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUIButtonCancel input')).toBeFocused();

  // take a screenshot of the dropdown menu where the "Cancel" button is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(menu.getByRole('menuitem', { name: 'Clear column', exact: true })).toBeFocused();

  // take a screenshot of the dropdown menu where the menu itself is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // take a screenshot of the grid without dropdown menu
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
