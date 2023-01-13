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
  const tbody = table.locator(helpers.selectors.mainTableBody);

  let cell = tbody.locator(helpers.findCell({ row: 3, cell: 3, cellType: 'td' }));

  await cell.click();
  await page.screenshot({ path: helpers.screenshotPath() });
  await page.keyboard.press(`${helpers.modifier}+c`);
  await cell.press('Delete');

  cell = tbody.locator(helpers.findCell({ row: 3, cell: 3, cellType: 'td' }));
  await cell.dblclick();
  await cell.type('-test');

  cell = tbody.locator(helpers.findCell({ row: 4, cell: 3, cellType: 'td' }));
  await cell.click();
  await page.keyboard.press('Delete');

  cell = tbody.locator(helpers.findCell({ row: 3, cell: 3, cellType: 'td' }));
  await cell.click();

  await page.screenshot({ path: helpers.screenshotPath() });
  await page.keyboard.down(`${helpers.modifier}`);
  await page.keyboard.press('v');
  await page.keyboard.up(`${helpers.modifier}`);
  await page.screenshot({ path: helpers.screenshotPath() });
});
