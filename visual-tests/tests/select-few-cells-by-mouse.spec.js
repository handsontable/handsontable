import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

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
  helpers.mainTableFirstColumn = table.locator(helpers.selectors.mainTableFirstColumn);
  helpers.tbody = table.locator(helpers.selectors.mainTableBody);
  helpers.thead = table.locator(helpers.selectors.mainTableHead);

  /* ==== */

  const cell = helpers.tbody.locator(helpers.findCell({ row: 2, cell: 2, cellType: 'td' }));
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
