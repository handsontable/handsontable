import { devices } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { MobileHandlesPage } from '../fixtures/pages/MobileHandlesPage';

/**
 * Regression spec for DEV-1081: on iPad Safari, mobile selection range handles
 * were missing and the fill/autocomplete square showed instead.
 *
 * Modern iPadOS reports a Macintosh desktop UA, so `isMobileBrowser()` is false
 * while `isIpadOS()` is true (`MacIntel` + `maxTouchPoints > 2`). iPhone 13
 * emulation makes `isMobileBrowser()` true and cannot catch this bug.
 *
 * Playwright Chromium on Linux reports `Linux x86_64`, so the Macintosh UA
 * alone is not enough: `addInitScript` must set `platform` and `maxTouchPoints`
 * before Handsontable's module-load `setPlatformMeta` / `setBrowserMeta` run.
 */
const IPAD_SAFARI_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15';

test.use({
  ...devices['Desktop Chrome'],
  hasTouch: true,
  browserName: 'chromium',
  userAgent: IPAD_SAFARI_DESKTOP_UA,
  viewport: { width: 1024, height: 768 },
});

test.describe('iPadOS selection range handles', () => {
  let grid: MobileHandlesPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'platform', {
        configurable: true,
        get: () => 'MacIntel',
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        configurable: true,
        get: () => 5,
      });
    });

    grid = new MobileHandlesPage(page, theme, bundle);
    await grid.goto();
  });

  test('show mobile range handles and hide the fill square after a tap', async () => {
    await grid.tapCell(1, 1);

    await expect.poll(() => grid.isHandlesPluginEnabled()).toBe(true);
    await grid.expectHandlesVisible();
    await grid.expectFillHandleHidden();
  });

  test('extend the selection when the bottom range handle is dragged', async () => {
    await grid.tapCell(1, 1);
    await grid.expectHandlesVisible();

    await expect.poll(() => grid.selectedLast()).toEqual([1, 1, 1, 1]);

    await grid.dragBottomHandleToCell(3, 3);

    await expect.poll(() => grid.selectedLast()).toEqual([1, 1, 3, 3]);
  });
});
