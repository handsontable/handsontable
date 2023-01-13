import { test, expect } from '@playwright/test';
import path from 'path';
import { helpers } from '../imports/helpers';

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

test(helpers.testTitle(path.basename(__filename)), async({ page }, workerInfo) => {
  helpers.init(workerInfo);
  await page.goto(helpers.testURL);
  await expect(page).toHaveTitle(helpers.expectedPageTitle);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();
  const tbody = table.locator(helpers.selectors.mainTableBody);

  const tbodyCoordinates = await tbody.boundingBox();

  await page.mouse.move(
    tbodyCoordinates.x + (tbodyCoordinates.width / 2), tbodyCoordinates.y + (tbodyCoordinates.height / 2)
  );

  await page.mouse.wheel(0, 270);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: helpers.screenshotPath() });
  await page.mouse.wheel(0, -270);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: helpers.screenshotPath() });
});
