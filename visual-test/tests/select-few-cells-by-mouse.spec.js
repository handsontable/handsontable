// eslint-disable-next-line no-unused-vars
import screenshotFilePath from '../imports/screenshotFilePath';
// eslint-disable-next-line no-unused-vars
import { helpers as helper } from '../imports/helpers';
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('@playwright/test');

/* ======= */

const testTitle = 'Select cells by mouse';
const testURL = 'https://handsontable.com/demo';
const expectedTitle = 'Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.';
const stylesToAdd = ['cookieInfo'];

// eslint-disable-next-line no-unused-vars
test(testTitle, async({ page }, workerInfo, screenshotsCount = 0) => {
  await page.goto(testURL);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helper.cssPath[item] }));
  await expect(page).toHaveTitle(expectedTitle);

  const table = page.locator(helper.mainTableSelector);

  await table.waitFor();

  const tbody = table.locator(helper.mainTableSelectorBody);

  const cell = tbody.locator(helper.findCell({ row: 2, cell: 2, cellType: 'td' }));
  const cellCoordinates = await cell.boundingBox();

  await page.mouse.move(
    cellCoordinates.x + (cellCoordinates.width / 2), cellCoordinates.y + (cellCoordinates.height / 2)
  );
  await page.mouse.down();
  await page.mouse.move(
    cellCoordinates.x + (cellCoordinates.width / 2) + 100, cellCoordinates.y + (cellCoordinates.height / 2) + 100
  );
  await page.mouse.up();
  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
});
