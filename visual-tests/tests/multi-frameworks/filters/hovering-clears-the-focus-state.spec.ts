import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

/**
 * Checks whether the hovering the menu items (e.g "Read only" entry) clears the state of the
 * focus order of the filters components.
 */
test(__filename, async({ tablePage }) => {
  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const changeTypeButton = table.locator(helpers.findDropdownMenuExpander({ col: 2 }));
  const dropdownMenu = tablePage.locator(helpers.selectors.dropdownMenu);

  await changeTypeButton.click();

  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab');
  await tablePage.keyboard.press('Tab'); // focus the "Select all" link

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // Hovering the menu item resets the focus order so the next Tab should focus the first filters component.
  // `hover()` names the element and runs the actionability checks (visible, stable, receives events at
  // the point) before moving; the previous raw `mouse.move` to a bounding-box coordinate did neither.
  await dropdownMenu.getByText('Clear column', { exact: true }).hover();

  // take a screenshot of the dropdown menu with hovered "Clear column" menu item
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
