import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * Checks whether ENTER does not close the menu at inappropriate moments. ENTER should accept the
 * filtering action only when the "Ok" button is focused.
 */
test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);
  const cell = tbody.locator(helpers.findCell({ row: 0, column: 1, cellType: 'td' }));

  await cell.click();
  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter'); // "Begins with"
  await page.waitForTimeout(100);
  await page.keyboard.type('Road', { delay: 100 });

  await page.keyboard.press('Enter'); // "Enter" here should do nothing

  // take a screenshot of the entered filter data
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter'); // "Enter" here should do nothing

  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter'); // "Enter" here should do nothing

  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab'); // focus search input
  await page.keyboard.press('Enter'); // "Enter" here should do nothing

  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab'); // focus "Ok" button
  await page.keyboard.press('Enter'); // "Enter" here accepts the filtering action

  await page.screenshot({ path: helpers.screenshotPath() });
});
