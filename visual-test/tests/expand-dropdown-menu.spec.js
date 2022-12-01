import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

const version = process.env.VERSION;
const wrapper = process.env.WRAPPER;

const testURL = `https://examples.handsontable.com/examples/${version}/docs/${wrapper}/demo/index.html`;
const expectedPageTitle = /Handsontable for .* example/;

const testTitle = 'Expand dropdown menu';
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

  const changeTypeButton = table.locator(helpers.findDropdownMenuExpander({ col: 2 }));

  await changeTypeButton.click();
  const dropdownMenu = page.locator(helpers.selectors.dropdownMenu);

  await page.screenshot({ path: helpers.screenshotPath() });
  await dropdownMenu.screenshot({ path: helpers.screenshotPath() });
  await dropdownMenu.locator('"Clear column"').click();
  await page.screenshot({ path: helpers.screenshotPath() });
});
