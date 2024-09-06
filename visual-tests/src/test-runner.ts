import path from 'path';
import { test as baseTest, expect, Page } from '@playwright/test';
import { helpers } from './helpers';
import PageHolder from './page-holder';

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

// Define your custom fixture
const test = baseTest.extend<{ tablePage: Page, customTitle: string }>({
  tablePage: async({ page }, use, workerInfo) => {
    helpers.init(workerInfo);
    PageHolder.getInstance().setPage(page);

    // Reset screenshotsCount before each test
    helpers.screenshotsCount = 0;

    await page.goto('/');
    await expect(page).toHaveTitle(helpers.expectedPageTitle);
    stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));
    const table = page.locator(helpers.selectors.mainTable);

    await table.waitFor();
    await use(page);
  },
  // eslint-disable-next-line no-empty-pattern
  customTitle: async({}, use, testInfo) => {
    const title = helpers.testTitle(path.basename(testInfo.title));

    await use(title);
  }
});

// Define your custom fixture
const testE2E = baseTest.extend<{ tablePage: Page, customTitle: string }>({
  tablePage: async({ page }, use, workerInfo) => {
    helpers.init(workerInfo);
    PageHolder.getInstance().setPage(page);

    await use(page);
  },
  // eslint-disable-next-line no-empty-pattern
  customTitle: async({}, use, testInfo) => {
    const title = helpers.testTitle(path.basename(testInfo.title));

    await use(title);
  }
});

// Export the custom fixture
export { expect, test, testE2E };
