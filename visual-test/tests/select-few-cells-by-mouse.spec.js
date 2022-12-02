import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

const hotVersion = process.env.HOT_VERSION || helpers.defaultHOTVersion;
const hotWrapper = process.env.HOT_WRAPPER || helpers.defaultHOTWrapper;

const testTitle = 'Select few cells using mouse';
const testURL = `https://examples.handsontable.com/examples/${hotVersion}/docs/${hotWrapper}/demo/index.html`;
const expectedPageTitle = /Handsontable for .* example/;

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

test(testTitle, async({ page }, workerInfo) => {
  helpers.init(workerInfo, hotWrapper);

  await page.goto(testURL);
  await expect(page).toHaveTitle(expectedPageTitle);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

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
