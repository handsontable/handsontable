import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

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

  const changeTypeButton = table.locator(helpers.findDropdownMenuExpander({ col: 2 }));

  await changeTypeButton.click();
  const dropdownMenu = page.locator(helpers.selectors.dropdownMenu);

  await page.screenshot({ path: helpers.screenshotPath() });
  await dropdownMenu.screenshot({ path: helpers.screenshotPath() });
  await dropdownMenu.locator('"Clear column"').click();
  await page.screenshot({ path: helpers.screenshotPath() });
});
