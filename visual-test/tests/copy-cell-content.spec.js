// eslint-disable-next-line no-unused-vars
import screenshotFilePath from '../imports/screenshotFilePath';
// eslint-disable-next-line no-unused-vars
import { helpers as helper } from '../imports/helpers';
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('@playwright/test');
// eslint-disable-next-line no-unused-vars, prefer-const
let screenshotsCount = 0;

/* ======= */

const testTitle = 'Copy content from one cell to another, modify cell content';
const testURL = 'https://handsontable.com/demo';
const expectedTitle = 'Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.';

test(testTitle, async({ page }, workerInfo) => {
  await page.goto(testURL);
  await page.addStyleTag({ path: helper.cssPath.cookieInfo });
  await expect(page).toHaveTitle(expectedTitle);

  const table = page.locator(helper.mainTableSelector);

  await table.waitFor();

  const tbody = table.locator(helper.mainTableSelectorBody);

  let cell = tbody.locator(helper.findCell({ row: 2, cell: 3, cellType: 'td' }));
  const modifier = helper.modifier(workerInfo);

  await cell.click();
  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
  await page.keyboard.press(`${modifier}+c`);
  await cell.press('Delete');

  cell = tbody.locator(helper.findCell({ row: 3, cell: 3, cellType: 'td' }));
  await cell.dblclick();
  await cell.type('-test');

  cell = tbody.locator(helper.findCell({ row: 4, cell: 3, cellType: 'td' }));
  await cell.click();
  await page.keyboard.press('Delete');

  cell = tbody.locator(helper.findCell({ row: 3, cell: 3, cellType: 'td' }));
  await cell.click();

  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
  await page.keyboard.down(`${modifier}`);
  await page.keyboard.press('v');
  await page.keyboard.up(`${modifier}`);
  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
});
