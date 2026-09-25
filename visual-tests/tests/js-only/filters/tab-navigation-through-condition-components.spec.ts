import { visualTest, test, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1280, height: 980 });
});

/**
 * The focus ring on each kind of control the Tab order reaches in the filter's condition and value
 * sections: the condition select, a condition's text input (with "Is between" chosen, so both of its
 * inputs are on screen), the "And" radio, and the search input. One capture per kind of control — the
 * second input, the "Or" radio and the second select repeat a ring already shown, and the order itself
 * is asserted hop by hop in `tests/e2e/filters-menu-focus-order.spec.ts`. Owned by DEV-3106.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ tablePage }) => {
  // Every capture waits for the focus state it photographs, so a wrong state fails the test instead of
  // becoming the golden. The in-menu locators hang off one root, so a wrong root fails their focus
  // checks rather than matching an element of another menu.
  const menu = tablePage.locator(helpers.selectors.dropdownMenu);
  const conditionSelect = menu.getByRole('menuitem').filter({ hasText: 'Filter by condition' })
    .getByRole('listbox');
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // open the dropdown menu
  await tablePage.keyboard.press('Tab');
  await expect(conditionSelect).toBeFocused();

  // the condition select focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Enter'); // open the list of conditions
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('ArrowDown');
  await tablePage.keyboard.press('Enter'); // choose "Is between" (the ninth condition of a date column)

  // Choosing a condition focuses its first input on a 10 ms timer
  // (handsontable/src/plugins/filters/component/condition.ts), so wait for the hand-off before
  // photographing it.
  const firstInput = menu.getByRole('menuitem').filter({ hasText: 'Is between' })
    .getByPlaceholder('Value', { exact: true });

  await expect(firstInput).toBeFocused();

  // the condition's first text input focused, with the second input beside it
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab'); // the second input
  await tablePage.keyboard.press('Tab');
  await expect(menu.getByRole('radio', { name: 'And', exact: true })).toBeFocused();

  // the "And" radio focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab'); // the "Or" radio
  await tablePage.keyboard.press('Tab'); // the second condition select
  await tablePage.keyboard.press('Tab');
  await expect(menu.getByPlaceholder('Search', { exact: true })).toBeFocused();

  // the search input focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
