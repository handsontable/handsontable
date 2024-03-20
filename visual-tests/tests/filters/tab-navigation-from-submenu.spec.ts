import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

/**
 * Checks whether pressing the Tab moves the focus to the filter's components.
 */
test(__filename, async({ page }) => {
  const cell = await selectCell(0, 2);

  await cell.click();
  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight'); // opens the "Alignment" submenu

  // take a screenshot of the submenu
  await page.screenshot({ path: helpers.screenshotPath() });

  // should close the submenu and focus the first filters component
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Tab');

  // take a screenshot of the focused search input element
  await page.screenshot({ path: helpers.screenshotPath() });
});
