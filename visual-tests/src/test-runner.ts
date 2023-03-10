import { test as _test, expect, Page } from '@playwright/test';
import path from 'path';
import { helpers } from './helpers';

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

/**
 * Exports the `test` function from Playwright, and configures its initial settings.
 *
 * @param {string} filename The name of the test.
 * @param {Function} callback The function to call for the test case.
 */
export async function test(filename: string, callback: (pageInfo: { page: Page }) => Promise<void>) {
  _test(helpers.testTitle(path.basename(filename)), async({ page }, workerInfo) => {
    helpers.init(workerInfo);

    await page.goto(helpers.testURL);
    await expect(page).toHaveTitle(helpers.expectedPageTitle);

    stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

    await callback({ page });
  });
}
