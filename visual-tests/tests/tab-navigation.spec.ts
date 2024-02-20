import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  await page.locator('html').press('Tab');

  // The table should be focused and the first cell of the first row should be selected
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.locator('html').press('Tab');
  await page.locator('html').press('Tab');
  await page.locator('html').press('Tab');
  await page.locator('html').press('Tab');
  await page.locator('html').press('Tab');
  await page.locator('html').press('Tab');
  await page.locator('html').press('Tab');
  await page.locator('html').press('Tab');

  // The table should be still focused and the last cell of the first row should be selected
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.locator('html').press('Tab');

  // The table should be unfocused and there should be no selection
  await page.screenshot({ path: helpers.screenshotPath() });
});
