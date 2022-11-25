// eslint-disable-next-line no-unused-vars
import screenshotFilePath from '../imports/screenshotFilePath';
// eslint-disable-next-line no-unused-vars
import { helpers as helper } from '../imports/helpers';
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('@playwright/test');
// eslint-disable-next-line no-unused-vars, prefer-const
let screenshotsCount = 0;

/* ======= */

const testTitle = 'Test mouse wheel';
const testURL = 'https://handsontable.com/demo';
const expectedTitle = 'Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.';

test(testTitle, async({ page }, workerInfo) => {
  await page.goto(testURL);
  await page.addStyleTag({ path: helper.cssPath.cookieInfo });
  await expect(page).toHaveTitle(expectedTitle);

  const table = page.locator(helper.mainTableSelector);

  await table.waitFor();

  const tbody = table.locator(helper.mainTableSelectorBody);
  const tbodyCoordinates = await tbody.boundingBox(); // || { x: 0, y: 0, width: 0, height: 0 };

  await table.waitFor();
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });

  await page.mouse.move(
    tbodyCoordinates.x + (tbodyCoordinates.width / 2), tbodyCoordinates.y + (tbodyCoordinates.height / 2)
  );

  await page.mouse.wheel(0, 270);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
  await page.mouse.wheel(0, -270);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
});
