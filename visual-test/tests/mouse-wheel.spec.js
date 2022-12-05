import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

test(helpers.testTitle(__filename), async({ page }, workerInfo) => {
  helpers.init(workerInfo, process);
  await page.goto(helpers.testURL);
  await expect(page).toHaveTitle(helpers.expectedPageTitle);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);
  const tbodyCoordinates = await tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: helpers.screenshotPath() });

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
