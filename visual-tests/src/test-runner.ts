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

    const isDarkTheme = helpers.hotTheme.includes('dark');

    // Headless Chromium on CI defaults prefers-color-scheme to 'light', so native
    // form controls (e.g. <input type="date">) always render in light mode even when
    // the active Handsontable theme sets `color-scheme: dark` via CSS. The CSS property
    // alone is not enough to override the browser-level media preference in headless mode.
    // Emulating the color scheme here aligns the browser with the theme before any
    // navigation happens, ensuring native controls render consistently with the theme.
    await page.emulateMedia({ colorScheme: isDarkTheme ? 'dark' : 'light' });

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

    const isDarkTheme = helpers.hotTheme.includes('dark');

    // See the same call in tablePage for the full explanation.
    await page.emulateMedia({ colorScheme: isDarkTheme ? 'dark' : 'light' });

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
