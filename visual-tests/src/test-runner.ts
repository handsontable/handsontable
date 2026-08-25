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
const bandSettleInstalled = new WeakSet<Page>();

/**
 * Waits out the scrollbar clearance (#10370), which is transient by design.
 *
 * Scrolling opens a band along the scrollbar's edge and clips the frozen overlays out of it; both go
 * away about a second later. A screenshot taken inside that window records whichever half of the
 * animation the runner happened to reach, so the same test flips between two correct-looking images
 * on nothing but machine speed — 118 snapshots changed on one PR that way, none of them a real diff.
 *
 * Both halves have to be waited for. The clip can outlive the band: a grid with headers and nothing
 * frozen used to publish a clip with no band behind it, so counting fillers alone would have called
 * that settled while a 16px strip still showed the wrong cells.
 *
 * @param {Page} page The page about to be captured.
 * @returns {Promise<unknown>} Resolves once nothing transient is on screen.
 */
function waitForScrollbarClearanceToSettle(page: Page) {
  // The callback runs in the browser, where `document` is the right global to use.
  /* eslint-disable no-restricted-globals */
  return page.waitForFunction(() => {
    const bands = document.querySelectorAll('.htScrollbarClearanceFiller').length;
    const clipped = [...document.querySelectorAll('[class*="ht_clone_"]')]
      .some(el => getComputedStyle(el).clipPath !== 'none');

    return bands === 0 && !clipped;
  }, undefined, { timeout: 5000 });
  /* eslint-enable no-restricted-globals */
}

/**
 * Makes every `screenshot()` on this page wait for that settle first. Wrapping the page is what makes
 * it uniform: the specs call `tablePage.screenshot()` directly, in a few hundred places.
 *
 * A timeout does not fail the test. The band is held open for as long as a pointer rests beside the
 * scrollbar, and a spec that leaves the mouse there would otherwise turn a visual check into a hang -
 * so a stuck band costs the old flaky screenshot, not a red suite.
 *
 * @param {Page} page The page to instrument.
 */
function installScrollbarClearanceSettle(page: Page) {
  if (bandSettleInstalled.has(page)) {
    return;
  }

  bandSettleInstalled.add(page);

  const capture = page.screenshot.bind(page);

  // eslint-disable-next-line no-param-reassign
  page.screenshot = (async(options?: Parameters<Page['screenshot']>[0]) => {
    await waitForScrollbarClearanceToSettle(page).catch(() => {});

    return capture(options);
  }) as Page['screenshot'];
}

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
    installScrollbarClearanceSettle(page);

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
    installScrollbarClearanceSettle(page);

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
