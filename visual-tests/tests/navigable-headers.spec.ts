import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);
  const cell = tbody.locator(helpers.findCell({ row: 0, column: 0, cellType: 'td' }));

  // move the focus to the corner
  await cell.click();
  await page.locator('html').press('ArrowLeft');
  await page.locator('html').press('ArrowUp');

  await page.screenshot({ path: helpers.screenshotPath() });
});
