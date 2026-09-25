import { visualTest, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * The focus ring on a value-list cell: ArrowDown from the search input enters the list on its first
 * value, and Space unticks that value, so the capture shows a focused cell with its checkbox cleared.
 * The way into and out of the list, and what Space and Enter toggle, are asserted in
 * `tests/e2e/filters-menu-focus-order.spec.ts`. Owned by DEV-3106.
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
  await tablePage.keyboard.press('Tab');
  await expect(menu.getByPlaceholder('Search', { exact: true })).toBeFocused();

  await tablePage.keyboard.press('ArrowDown');
  await expect(menu.getByRole('gridcell', { name: 'Checked 1/10/20', exact: true })).toBeFocused();

  await tablePage.keyboard.press('Space');
  // A value-list cell is named by its checkbox state and its value, so this also pins what Space did:
  // it unticked "1/10/20" and left the focus there.
  await expect(menu.getByRole('gridcell', { name: 'Unchecked 1/10/20', exact: true })).toBeFocused();

  // a focused value-list cell, unticked
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
