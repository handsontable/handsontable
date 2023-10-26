import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * Checks whether the hovering the menu items (e.g "Read only" entry) clears the state of the
 * focus order of the filters components.
 */
test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const changeTypeButton = table.locator(helpers.findDropdownMenuExpander({ col: 2 }));
  const dropdownMenu = page.locator(helpers.selectors.dropdownMenu);

  await changeTypeButton.click();

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab'); // focus the "Select all" link

  await page.screenshot({ path: helpers.screenshotPath() });

  const clearColumnBox = await dropdownMenu.locator('"Clear column"').boundingBox();

  // Hovering the menu item resets the focus order so the next Tab should focus the first filters component
  await page.mouse.move(clearColumnBox!.x, clearColumnBox!.y);

  // take a screenshot of the dropdown menu with hovered "Clear column" menu item
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await page.screenshot({ path: helpers.screenshotPath() });
});
