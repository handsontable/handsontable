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
  }, undefined, { timeout: 5000, polling: 100 });
  /* eslint-enable no-restricted-globals */
}

/**
 * Drops the browser's own text-selection highlight, which a click sequence can leave behind.
 *
 * A filter flow can end with the column header's label selected - seen on `columns-filter-2` under
 * WebKit - and nothing in the grid takes it away: `clearTextSelection()` runs on a mousedown inside
 * the grid, and the last click of that flow lands in the dropdown menu. The highlight paints the
 * browser default over whatever text it covers, so the same spec publishes two correct-looking
 * images on nothing but where the run happened to leave the caret.
 *
 * The grid's own cell selection is drawn by Handsontable and is not a native selection - with one
 * exception. `CopyPaste` puts a real TD into a native range for its Safari clipboard path
 * (`makeElementContentEditableAndSelectItsContent`), so this does reach it. That range carries the
 * `invisibleSelection` class, which hides it, so clearing it changes no pixel today.
 *
 * `fragmentSelection` is the case to watch. It is a real setting whose whole point is a visible
 * native selection spanning TDs (`tableView.ts`), and no visual spec turns it on. A spec that did
 * would need this clear skipped, or its selection is stripped before the capture with nothing on
 * screen to explain why.
 *
 * A focused text control is left alone, because `removeAllRanges()` collapses the selection inside
 * one and an open editor is often captured with its value selected. The test is `selectionStart`
 * being a number, which holds only for controls that own a text selection. Reading `value` instead
 * would skip the clear whenever a checkbox, radio, range or color input has focus - each of those
 * reports a non-empty default (`"on"`, `"50"`, `"#000000"`) - and a stray selection elsewhere on the
 * page would then survive into the screenshot.
 *
 * @param {Page} page The page about to be captured.
 * @returns {Promise<void>} Resolves once no stray native selection is left.
 */
function clearNativeTextSelection(page: Page) {
  // The callback runs in the browser, where `window` and `document` are the right globals to use.
  /* eslint-disable no-restricted-globals */
  return page.evaluate(() => {
    const active = document.activeElement;
    const ownsTextSelection =
      (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
      typeof active.selectionStart === 'number';

    if (ownsTextSelection) {
      return;
    }

    window.getSelection()?.removeAllRanges();
  });
  /* eslint-enable no-restricted-globals */
}

/**
 * Makes every `screenshot()` on this page wait for that settle first, and drop any stray native text
 * selection. Wrapping the page is what makes it uniform: the specs call `tablePage.screenshot()`
 * directly, in a few hundred places.
 *
 * Neither step fails the test. The band is held open for as long as a pointer rests beside the
 * scrollbar, and a spec that leaves the mouse there would otherwise turn a visual check into a hang -
 * so a stuck band costs the old flaky screenshot, not a red suite. The selection clear is best-effort
 * for the same reason: a page torn down mid-capture must not turn into a failure.
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
    await clearNativeTextSelection(page).catch(() => {});

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
export { expect, test, waitForScrollbarClearanceToSettle };
