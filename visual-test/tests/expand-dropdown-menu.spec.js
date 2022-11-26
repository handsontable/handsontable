// eslint-disable-next-line no-unused-vars
import { helpers } from '../imports/helpers';
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('@playwright/test');

/* ======= */

const testTitle = 'Expand dropdown menu and clear column';
const testURL = 'https://handsontable.com/demo';
const expectedPageTitle = 'Data grid demo - Handsontable data grid for JavaScript, React, Angular, and Vue.';
const stylesToAdd = ['cookieInfo'];

// eslint-disable-next-line no-unused-vars
test(testTitle, async({ page }, workerInfo) => {
  helpers.init(workerInfo);

  await page.goto(testURL);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath[item] }));
  await expect(page).toHaveTitle(expectedPageTitle);

  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const thead = table.locator(helpers.selectors.mainTableHead);
  const cell = thead.locator(helpers.findCell({ row: 1, cell: 4, cellType: 'th' }));
  const changeTypeButton = cell.locator(helpers.selectors.expandDropdownMenuButton);

  await changeTypeButton.click({ force: true });
  const dropdownMenu = page.locator(helpers.selectors.dropdownMenu);

  await page.screenshot({ path: helpers.screenshotPath() });
  await dropdownMenu.screenshot({ path: helpers.screenshotPath() });
  await dropdownMenu.locator('"Clear column"').click();
  await page.screenshot({ path: helpers.screenshotPath() });
});
