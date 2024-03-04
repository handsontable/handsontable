import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell } from '../../src/page-helpers';

/**
 * Checks whether entering to the list component (ArrowDown) or escaping (Tab or Shift+Tab) works correctly.
 */
test(__filename, async({ page }) => {
  const cell = await selectCell(0, 2);

  await cell.click();
  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the search input is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // take a screenshot of the focused "by value" component
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');

  // take a screenshot of the focused "Clear" link element
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');

  // take a screenshot of the focused "Select all" link element
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Shift+Tab');

  // take a screenshot of the focused search input element
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // take a screenshot of the focused "by value" component
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Tab');

  // take a screenshot of the focused "Ok" button
  await page.screenshot({ path: helpers.screenshotPath() });
});
