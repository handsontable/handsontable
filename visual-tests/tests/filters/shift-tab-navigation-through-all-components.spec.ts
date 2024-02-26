import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell, tryToEscapeFromTheComponentsFocus } from '../../src/page-helpers';

/**
 * Checks whether pressing the Shift+Tab moves the focus backward within the filter's components.
 */
test(__filename, async({ page }) => {
  const cell = await selectCell(0, 2);

  await cell.click();
  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  // take a screenshot of the dropdown menu without selecting any of the item
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Cancel" button
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Ok" button
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Clear" link
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Select all" link
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');

  // take a screenshot of the focused search input of the "by value" component
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');

  // take a screenshot of the focused menu with the last highlighted item
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');
  await tryToEscapeFromTheComponentsFocus();

  // take a screenshot of the focused "Cancel" button (tab order starts looping from here)
  await page.screenshot({ path: helpers.screenshotPath() });
});
