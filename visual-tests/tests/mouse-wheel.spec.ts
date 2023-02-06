import { test } from '../src/test-runner';
import { helpers } from '../src/helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);

  const tbodyCoordinates = await tbody.boundingBox();

  await page.mouse.move(
    tbodyCoordinates!.x + (tbodyCoordinates!.width / 2),
    tbodyCoordinates!.y + (tbodyCoordinates!.height / 2)
  );

  await page.mouse.wheel(0, 270);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: helpers.screenshotPath() });
  await page.mouse.wheel(0, -270);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: helpers.screenshotPath() });
});
