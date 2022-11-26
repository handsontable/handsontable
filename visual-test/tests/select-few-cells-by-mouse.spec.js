import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

const testTitle = 'Select cells by mouse';
const testURL = 'https://handsontable.com/demo';
const expectedPageTitle = 'Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.';
const stylesToAdd = ['cookieInfo'];

test(testTitle, async({ page }, workerInfo) => {
  helpers.init(workerInfo);

  await page.goto(testURL);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath[item] }));
  await expect(page).toHaveTitle(expectedPageTitle);

  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const tbody = table.locator(helpers.selectors.mainTableBody);

  const cell = tbody.locator(helpers.findCell({ row: 2, cell: 2, cellType: 'td' }));
  const cellCoordinates = await cell.boundingBox();

  await page.mouse.move(
    cellCoordinates.x + (cellCoordinates.width / 2), cellCoordinates.y + (cellCoordinates.height / 2)
  );
  await page.mouse.down();
  await page.mouse.move(
    cellCoordinates.x + (cellCoordinates.width / 2) + 100, cellCoordinates.y + (cellCoordinates.height / 2) + 100
  );
  await page.mouse.up();
  await page.screenshot({ path: helpers.screenshotPath() });
});
