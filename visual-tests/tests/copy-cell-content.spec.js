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

  let cell = helpers.tbody.locator(helpers.findCell({ row: 3, cell: 3, cellType: 'td' }));

  await cell.click();
  await page.screenshot({ path: helpers.screenshotPath() });
  await page.keyboard.press(`${helpers.modifier}+c`);
  await cell.press('Delete');

  cell = helpers.tbody.locator(helpers.findCell({ row: 3, cell: 3, cellType: 'td' }));
  await cell.dblclick();
  await cell.type('-test');

  cell = helpers.tbody.locator(helpers.findCell({ row: 4, cell: 3, cellType: 'td' }));
  await cell.click();
  await page.keyboard.press('Delete');

  cell = helpers.tbody.locator(helpers.findCell({ row: 3, cell: 3, cellType: 'td' }));
  await cell.click();

  await page.screenshot({ path: helpers.screenshotPath() });
  await page.keyboard.down(`${helpers.modifier}`);
  await page.keyboard.press('v');
  await page.keyboard.up(`${helpers.modifier}`);
  await page.screenshot({ path: helpers.screenshotPath() });
});
