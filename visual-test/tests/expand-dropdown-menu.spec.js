// eslint-disable-next-line no-unused-vars
import screenshotFilePath from '../imports/screenshotFilePath';
// eslint-disable-next-line no-unused-vars
import { helpers as helper } from '../imports/helpers';
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('@playwright/test');

/* ======= */

const testTitle = 'Expand dropdown menu and clear column';
const testURL = 'https://handsontable.com/demo';
const expectedTitle = 'Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.';
const stylesToAdd = ['cookieInfo'];

// eslint-disable-next-line no-unused-vars
test(testTitle, async({ page }, workerInfo, screenshotsCount = 0) => {
  await page.goto(testURL);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helper.cssPath[item] }));
  await expect(page).toHaveTitle(expectedTitle);

  const table = page.locator(helper.mainTableSelector);

  await table.waitFor();

  const thead = table.locator(helper.mainTableSelectorHead);
  const cell = thead.locator(helper.findCell({ row: 1, cell: 4, cellType: 'th' }));
  const changeTypeButton = cell.locator(helper.expandDropdownMenuButtonSelector);

  await changeTypeButton.click({ force: true });
  const dropdownMenu = page.locator(helper.dropdownMenuSelector);

  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
  await dropdownMenu.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
  await dropdownMenu.locator('"Clear column"').click();
  await page.screenshot({ path: screenshotFilePath(screenshotsCount += 1, workerInfo) });
});
