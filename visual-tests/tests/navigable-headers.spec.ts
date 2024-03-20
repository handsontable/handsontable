import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';
import { selectCell } from '../src/page-helpers';

test(__filename, async({ page }) => {
  const cell = await selectCell(0, 0);

  // move the focus to the corner
  await cell.click();
  await page.locator('html').press('ArrowLeft');
  await page.locator('html').press('ArrowUp');

  await page.screenshot({ path: helpers.screenshotPath() });
});
