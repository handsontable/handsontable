import path from 'path';
import { test as baseTest, expect, Page } from '@playwright/test';
import { helpers } from './helpers';
import PageHolder from './page-holder';

helpers.init();

const stylesToAdd = [
  helpers.cssFiles.cookieInfo,
  helpers.cssFiles.dynamicDataFreeze
];

const shouldImplicitlyNavigate = new WeakSet();

type TestParams = {
  tablePage: Page;
  customTitle: string;
  goto: (url: string) => Promise<void>;
};

// Define your custom fixture
const test = baseTest.extend<TestParams>({
  async tablePage({ page }, use, testInfo) {
    PageHolder.getInstance().setPage(page);
    helpers.screenshotsCount = 0;

    if (shouldImplicitlyNavigate.has(page)) {
      await use(page);

      return;
    }

    await page.goto(
      helpers
        .setBaseUrl('/')
        .setPageParams({ direction: 'ltr' })
        .getFullUrl()
    );

    await page.waitForLoadState('load');
    await expect(page).toHaveTitle(helpers.expectedPageTitle);

    helpers.setTestDetails({
      rootDir: testInfo.config.rootDir,
      testFilePath: testInfo.file,
      browser: testInfo.project.name,
      testedPageUrl: page.url(),
    });

    // disable animations and transitions on all testing pages (for consistent screenshots)
    await page.addStyleTag({
      content: `
        *,
        *::before,
        *::after {
            animation: none !important;
            transition: none !important;
        }
      `
    });

    stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

    const table = page.locator(helpers.selectors.anyTable).first();

    await table.waitFor();
    await use(page);
  },
  // eslint-disable-next-line no-empty-pattern
  async customTitle({}, use, testInfo) {
    const title = helpers.testTitle(path.basename(testInfo.title));

    await use(title);
  },
  async goto({ page }, use, testInfo) {
    shouldImplicitlyNavigate.add(page);

    await use(async(url) => {
      await page.goto(url);

      helpers.setBaseUrl('/').setPageParams({ direction: 'ltr' });

      await page.waitForLoadState('load');
      await expect(page).toHaveTitle(helpers.expectedPageTitle);

      helpers.setTestDetails({
        rootDir: testInfo.config.rootDir,
        testFilePath: testInfo.file,
        browser: testInfo.project.name,
        testedPageUrl: page.url(),
      });

      // disable animations and transitions on all testing pages (for consistent screenshots)
      await page.addStyleTag({
        content: `
          *,
          *::before,
          *::after {
              animation: none !important;
              transition: none !important;
          }
        `
      });

      stylesToAdd.forEach(item => page.addStyleTag({ path: helpers.cssPath(item) }));

      const table = page.locator(helpers.selectors.anyTable).first();

      await table.waitFor();
    });
  }
});

// Export the custom fixture
export { expect, test };
