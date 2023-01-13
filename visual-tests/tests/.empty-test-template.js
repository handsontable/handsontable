import { test, expect } from '@playwright/test';
import path from 'path';
import { helpers } from '../imports/helpers';

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

test(helpers.testTitle(path.basename(__filename)), async({ page }, workerInfo) => {
  helpers.init(workerInfo);
  await page.goto(helpers.testURL);
  await expect(page).toHaveTitle(helpers.expectedPageTitle);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();
  // const mainTableFirstColumn = table.locator(helpers.selectors.mainTableFirstColumn);
  // const tbody = table.locator(helpers.selectors.mainTableBody);
  // const thead = table.locator(helpers.selectors.mainTableHead);

  /* your test here */

});
