import { visualTest, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * The focus ring on a value-list value: ArrowDown from the search input enters the list on its first
 * value, and Space unticks that value, so the capture shows a focused cell with its checkbox cleared.
 * `tests/e2e/filters-menu-focus-order.spec.ts` asserts the way into and out of the list, what Space and
 * Enter toggle, and that a focused value scrolls fully into the list's view.
 * The bare `classic` pass stays in the declaration: it is the delivery-path parity check
 * `visual-tests/AGENTS.md` (Tiers) describes, and the `Visual stability` night renders this family on
 * `classic` and one theme. Owned by DEV-3106.
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

  // A value is a checkbox named by the value, and the focus is on the checkbox.
  const value = menu.getByRole('checkbox', { name: '1/10/20', exact: true });

  await tablePage.keyboard.press('ArrowDown');
  await expect(value).toBeFocused();
  await expect(value).toBeChecked();

  await tablePage.keyboard.press('Space');
  // Space unticked "1/10/20" and left the focus there.
  await expect(value).toBeFocused();
  await expect(value).not.toBeChecked();

  // a focused value-list cell, unticked
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
