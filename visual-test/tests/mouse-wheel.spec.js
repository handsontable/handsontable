// eslint-disable-next-line no-unused-vars
import { helpers } from '../imports/helpers';
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('@playwright/test');

/* ======= */

const testTitle = 'Test mouse wheel';
const testURL = 'https://handsontable.com/demo';
const expectedPageTitle = 'Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.';
const stylesToAdd = ['cookieInfo'];

// eslint-disable-next-line no-unused-vars
test(testTitle, async({ page }, workerInfo) => {
  helpers.init(workerInfo);

  await page.goto(testURL);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath[item] }));
  await expect(page).toHaveTitle(expectedPageTitle);

  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);
  const tbodyCoordinates = await tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  await table.waitFor();
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
