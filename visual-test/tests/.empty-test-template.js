// eslint-disable-next-line no-unused-vars
import { helpers } from '../imports/helpers';
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('@playwright/test');

/* ======= */

const testTitle = '';
const testURL = '';
const expectedPageTitle = '';
const stylesToAdd = ['cookieInfo'];

test(testTitle, async({ page }, workerInfo) => {
  helpers.init(workerInfo);

  await page.goto(testURL);
  stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath[item] }));
  await expect(page).toHaveTitle(expectedPageTitle);

  /* your test here */

});
