import { devices, type Page } from '@playwright/test';
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

const CLOCK_START = new Date('2026-08-28T10:00:00Z');

/**
 * Playwright Chromium on Linux reports `Linux x86_64`, so the Macintosh UA
 * alone is not enough: set `platform` and `maxTouchPoints` before Handsontable's
 * module-load `setPlatformMeta` / `setBrowserMeta` run.
 */
async function emulateIpadOS(page: Page): Promise<void> {
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
}

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
    await emulateIpadOS(page);

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

  test('keep the moveCells drag band on iPad when the option is on', async () => {
    await grid.enableMoveCells();
    await grid.selectRange(1, 1, 2, 2);
    await grid.expectHandlesVisible();

    await expect(grid.moveZones().first()).toBeVisible();
  });

  test('starts a moveCells drag from a mouse press on the band, away from the range handle', async ({ page }) => {
    await grid.enableMoveCells();
    await grid.selectRange(1, 1, 3, 3);
    await grid.expectHandlesVisible();
    await expect(grid.moveZones().first()).toBeVisible();

    // The 6px `wtMoveZone` band sits on the selection edge (mousedown). The 40px handle hit
    // area hangs off the corner and listens for `touchstart` only. A trackpad press at the
    // band midpoint must still enter the move-drag state.
    await grid.pressTopMoveBandMidpoint();

    await expect(grid.movingRoot()).toHaveCount(1);

    await page.keyboard.press('Escape');
    await page.mouse.up();

    await expect(grid.movingRoot()).toHaveCount(0);
  });

  test('does not extend the selection from a mouse drag on the range handle', async () => {
    await grid.enableMoveCells();
    await grid.selectRange(1, 1, 1, 1);
    await grid.expectHandlesVisible();

    // Fail closed if the move band covers the painted handle: the drag would then start a
    // move (or miss both) instead of proving the handle itself ignores mouse.
    expect(await grid.isBottomHandleHitAreaAtHandleCenter()).toBe(true);

    await grid.mouseDragBottomHandleBy(80, 80);

    await expect.poll(() => grid.selectedLast()).toEqual([1, 1, 1, 1]);
  });
});

test.describe('iPadOS double-tap to edit with range handles present', () => {
  let grid: MobileHandlesPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    await page.clock.install({ time: CLOCK_START });
    await emulateIpadOS(page);

    grid = new MobileHandlesPage(page, theme, bundle);
    await grid.goto();
    await page.clock.pauseAt(CLOCK_START.getTime() + 60_000);
  });

  test('opens the editor on a double-tap after the cell is selected', async ({ page }) => {
    await grid.tapCell(1, 1);
    await page.clock.runFor(1500);
    await grid.expectHandlesVisible();
    await grid.expectEditorClosed();

    await grid.tapCell(1, 1);
    await page.clock.runFor(700);
    await grid.tapCell(1, 1);

    await grid.expectEditorOpen();
  });
});

test.describe('iPadOS frozen-top corner reserve', () => {
  let grid: MobileHandlesPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    await emulateIpadOS(page);

    grid = new MobileHandlesPage(page, theme, bundle);
    await grid.goto({ frozen: true });
  });

  test('grows the top overlay holder for a frozen-row selection even with the fill handle off', async () => {
    // Isolates the `isMobileOrIpadOS()` branch in `shouldReserveSelectionCornerOffset`: on iPad
    // the fill square is hidden, so `cornerVisible` is false once `fillHandle` is off, and the
    // desktop fallback would skip the reserve. The mobile/iPad gate still adds half the corner.
    await grid.disableFillHandle();
    await grid.selectRange(0, 1, 0, 1);

    const expected = await grid.autofillCornerHalfHeight();

    expect(expected).toBeGreaterThan(0);
    await expect.poll(() => grid.topOverlayHolderOverhang()).toBe(expected);

    await grid.selectRange(2, 1, 2, 1);

    await expect.poll(() => grid.topOverlayHolderOverhang()).toBe(0);
  });
});
