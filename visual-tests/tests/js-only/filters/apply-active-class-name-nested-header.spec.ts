import { visualTest, test, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks that a condition filter tints the filtered column's bottom-most header with the theme's active
 * filter tokens, and leaves the nested group header above it alone. Before #11381 the class reached the
 * group header too. One capture on every js variant, after asserting the menu closed, the "Pricing" leaf
 * header carries `htFiltersActive` and its "Product" group header does not. The menu is driven by the
 * keyboard, so each step asserts where the focus or the highlight landed before the next key. The menu's
 * Tab order itself is asserted by `tests/e2e/filters-menu-focus-order.spec.ts`. Added in #11381; owned by
 * DEV-3382.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/nested-headers-demo')
      .getFullUrl()
  );

  const cell = await selectCell(0, 2);
  const dropdownMenu = tablePage.locator(helpers.selectors.dropdownMenu);
  const conditionsMenu = tablePage.locator('.htFiltersConditionsMenu .ht_master table');
  const conditionCaption = dropdownMenu.getByRole('listbox').first().locator('.htUISelectCaption');
  const okButton = dropdownMenu.getByRole('button', { name: 'OK', exact: true });
  const topHeader = tablePage.locator('.ht_clone_top thead');
  const leafHeader = topHeader.locator('tr:last-child > th').filter({ hasText: 'Pricing' });
  const groupHeader = topHeader.locator('tr:first-child > th').filter({ hasText: 'Product' });

  await cell.click();
  await expect(cell).toHaveClass(/(^|\s)current(\s|$)/);

  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // open the column's dropdown menu
  await expect(dropdownMenu).toBeVisible();

  await tablePage.keyboard.press('Tab'); // focus the filter by condition select
  await tablePage.keyboard.press('Enter'); // open its list
  await expect(conditionsMenu).toBeVisible();

  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter'); // choose "Is not empty", which takes no value
  await expect(conditionsMenu).toBeHidden();
  await expect(conditionCaption).toHaveText('Is not empty');

  // From the select, the Tab order runs through the second condition, the value search and the value
  // list's controls to the action bar.
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await expect(okButton).toBeFocused();

  await tablePage.keyboard.press('Enter'); // apply the filter
  await expect(dropdownMenu).toBeHidden();
  await expect(leafHeader).toHaveClass(/(^|\s)htFiltersActive(\s|$)/);
  await expect(groupHeader).not.toHaveClass(/(^|\s)htFiltersActive(\s|$)/);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
