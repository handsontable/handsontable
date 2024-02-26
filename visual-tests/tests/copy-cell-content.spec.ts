import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';
import { selectCell } from '../src/page-helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  let cell = await selectCell(2, 1);

  await cell.click();
  await page.screenshot({ path: helpers.screenshotPath() });
  await page.keyboard.press(`${helpers.modifier}+c`);
  await cell.press('Delete');

  cell = await selectCell(2, 1);
  await cell.dblclick();
  await table.type('-test');

  cell = await selectCell(3, 1);
  await cell.click();
  await page.keyboard.press('Delete');

  cell = await selectCell(2, 1);
  await cell.click();

  await page.screenshot({ path: helpers.screenshotPath() });
  await page.keyboard.down(`${helpers.modifier}`);
  await page.keyboard.press('v');
  await page.keyboard.up(`${helpers.modifier}`);
  await page.screenshot({ path: helpers.screenshotPath() });
});
