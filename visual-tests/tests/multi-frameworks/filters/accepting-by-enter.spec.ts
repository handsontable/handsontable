import { visualTest, expect, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks whether ENTER does not close the menu at inappropriate moments. ENTER should accept the
 * filtering action only when the "Ok" button is focused: the first four captures show the menu still
 * open with the focus moved on, and the last one shows the filter applied and the menu closed. Owned by
 * DEV-2981, which folds this spec's five captures into the filters consolidation.
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
  const cell = await selectCell(0, 1);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Enter');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter'); // "Begins with"

  // The condition component focuses its input on a 10 ms timer (filters/component/condition.ts);
  // typing before that lands the text in the select. Wait for the state, not for a duration.
  const beginsWithInput = menu
    .getByRole('menuitem').filter({ hasText: 'Begins with' })
    .getByPlaceholder('Value', { exact: true });

  await expect(beginsWithInput).toBeFocused();
  await tablePage.keyboard.type('Road', { delay: 100 });

  await tablePage.keyboard.press('Enter'); // "Enter" here should do nothing
  await expect(beginsWithInput).toBeFocused();
  await expect(beginsWithInput).toHaveValue('Road');

  // take a screenshot of the entered filter data
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Enter'); // "Enter" here should do nothing
  await expect(menu.getByRole('radio', { name: 'And', exact: true })).toBeFocused();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Enter'); // "Enter" here should do nothing
  await expect(menu.getByRole('radio', { name: 'Or', exact: true })).toBeFocused();
  await expect(menu.getByRole('radio', { name: 'And', exact: true })).toBeChecked();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab'); // focus search input
  await tablePage.keyboard.press('Enter'); // "Enter" here should do nothing
  await expect(menu.getByPlaceholder('Search', { exact: true })).toBeFocused();

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab'); // focus "Ok" button
  await tablePage.keyboard.press('Enter'); // "Enter" here accepts the filtering action
  await expect(menu).toBeHidden();
  // The column header exists in the master table and in the top overlay; the overlay is the one on
  // screen, and the one the focus returns to.
  await expect(tablePage.locator('.ht_clone_top th.htFiltersActive')).toBeFocused();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
