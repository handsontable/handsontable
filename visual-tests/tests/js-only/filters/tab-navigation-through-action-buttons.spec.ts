import { visualTest, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * The focus ring on the filter's action controls, and the highlight the loop restores: the "Select all"
 * link, the "OK" button, the "Cancel" button, and — one more Tab — the menu itself, with "Clear column",
 * the item it opened on, highlighted again (#10603). The "Clear" link repeats the ring "Select all"
 * shows. The order itself is asserted hop by hop in `tests/e2e/filters-menu-focus-order.spec.ts`.
 * Owned by DEV-3106.
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
  const cell = await selectCell(0, 2);

  await cell.click();
  await tablePage.keyboard.press('Alt+Shift+ArrowDown'); // open the dropdown menu
  await tablePage.keyboard.press('Tab'); // the condition select
  await tablePage.keyboard.press('Tab'); // the search input
  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUISelectAll a')).toBeFocused();

  // the "Select all" link focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab'); // the "Clear" link
  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUIButtonOK input')).toBeFocused();

  // the "OK" button focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await expect(menu.locator('.htUIButtonCancel input')).toBeFocused();

  // the "Cancel" button focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');
  await expect(menu.getByRole('menuitem', { name: 'Clear column', exact: true })).toBeFocused();

  // the menu focused again, with the item it opened on highlighted
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
