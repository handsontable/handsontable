import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

const version = process.env.VERSION || helpers.defaultHOTVersion;
const wrapper = process.env.WRAPPER || helpers.defaultHOTWrapper;

const testURL = `https://examples.handsontable.com/examples/${version}/docs/${wrapper}/demo/index.html`;
const expectedPageTitle = /Handsontable for .* example/;

const testTitle = 'Mouse wheel in page and in table';
const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

test(testTitle, async({ page }, workerInfo) => {
  helpers.init(workerInfo, wrapper);

  await page.goto(testURL);
  await expect(page).toHaveTitle(expectedPageTitle);
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
