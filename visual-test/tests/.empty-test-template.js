import { helpers } from '../imports/helpers';

const { test, expect } = require('@playwright/test');

/* ======= */

const version = process.env.VERSION || helpers.defaultHOTVersion;
const wrapper = process.env.WRAPPER || helpers.defaultHOTWrapper;

const testURL = `https://examples.handsontable.com/examples/${version}/docs/${wrapper}/demo/index.html`;
const expectedPageTitle = /Handsontable for .* example/;

const testTitle = 'Test this and test that';
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
  
  /* your test here */

});
