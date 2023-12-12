import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * Checks whether pressing the ESCAPE key within any focused component closes the menu.
 */
test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);
  const cell = tbody.locator(helpers.findCell({ row: 0, column: 2, cellType: 'td' }));

  await cell.click();
  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the first filter's component is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the search input is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // take a screenshot of the dropdown menu where the list (handsontable) is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the "Select all" link is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the "Clear" link is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the "Ok" button is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the "Cancel" button is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Alt+Shift+ArrowDown'); // trigger the dropdown menu to show up

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // take a screenshot of the dropdown menu where the menu itself is focused
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.keyboard.press('Escape');

  // take a screenshot of the grid without dropdown menu
  await page.screenshot({ path: helpers.screenshotPath() });
});
