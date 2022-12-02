import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

const hotVersion = process.env.HOT_VERSION || helpers.defaultHOTVersion;
const hotWrapper = process.env.HOT_WRAPPER || helpers.defaultHOTWrapper;

const testTitle = 'Test this and test that';
const testURL = `https://examples.handsontable.com/examples/${hotVersion}/docs/${hotWrapper}/demo/index.html`;
const expectedPageTitle = /Handsontable for .* example/;

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

test(testTitle, async({ page }, workerInfo) => {
  helpers.init(workerInfo, hotWrapper);

  await page.goto(testURL);
  await expect(page).toHaveTitle(expectedPageTitle);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();
  
  /* your test here */

});
