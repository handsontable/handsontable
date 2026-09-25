import { visualTest, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * The focus ring on the filter's action controls, and the menu highlight: the "Select all" link, the
 * "OK" button, the "Cancel" button, and – one more Tab – the menu itself, focused again with "Clear
 * column" highlighted. In this demo that row is both the item the menu opened on and its first enabled
 * item (the demo sets `columns`, so the column items are disabled), so the frame shows how a restored
 * highlight looks, not that the loop restored it; `tests/e2e/filters-menu-focus-order.spec.ts` asserts
 * the restore (#10603) on a non-first item, and the order hop by hop. The "Clear" link shares the
 * "Select all" link's `:focus` rule, so it would repeat a ring already shown.
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
