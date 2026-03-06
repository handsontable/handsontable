import { test } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

test(__filename, async({ tablePage }) => {
  await tablePage.locator('html').press('Shift+Tab');

  // The table should be focused and the last cell of the last row should be selected
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');
  await tablePage.locator('html').press('Shift+Tab');

  // The table should be still focused and the first cell of the last row should be selected
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  await tablePage.locator('html').press('Shift+Tab');

  // The table should be unfocused and there should be no selection
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
