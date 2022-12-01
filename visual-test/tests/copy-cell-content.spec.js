import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

const version = process.env.VERSION || helpers.defaultHOTVersion;
const wrapper = process.env.WRAPPER || helpers.defaultHOTWrapper;

const testURL = `https://examples.handsontable.com/examples/${version}/docs/${wrapper}/demo/index.html`;
const expectedPageTitle = /Handsontable for .* example/;

const testTitle = 'Copy cell content';
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
