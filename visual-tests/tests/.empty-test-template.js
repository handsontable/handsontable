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

  /* your test here */

});
