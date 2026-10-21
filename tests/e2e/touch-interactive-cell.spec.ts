import { devices } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { TouchInteractiveCellPage } from '../fixtures/pages/TouchInteractiveCellPage';

const IOS_CHROME_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.163 Mobile/15E148 Safari/604.1';

/**
 * DEV-332 / DEV-891. Phone emulation matches the report: a renderer button or file input
 * receives no click when `disableVisualSelection` is on, because every `touchend` is cancelled.
 * Pixel 7 is the profile from the report. Chromium synthesizes the click `locator.tap()` would
 * produce on that device.
 */
test.use({
  ...devices['Pixel 7'],
  browserName: 'chromium',
});

test.describe('touch taps on interactive renderer elements', () => {
  let grid: TouchInteractiveCellPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new TouchInteractiveCellPage(page, theme, bundle);
    await grid.goto();
  });

  test('a tap runs a button when visual selection is off', async () => {
    await grid.tap('button-off');
    await grid.expectClicks('button-off', 1);
    await grid.clickBarrier();
    await grid.expectClicksExact('button-off', 1);
  });

  test('a tap runs a file input when visual selection is off', async () => {
    await grid.tap('file-input');
    await grid.expectClicks('file-input', 1);
    await grid.clickBarrier();
    await grid.expectClicksExact('file-input', 1);
  });

  test('a tap on a file input label runs the input when visual selection is off', async () => {
    await grid.tap('file-label-text');
    await grid.expectClicks('file-via-label', 1);
    await grid.clickBarrier();
    await grid.expectClicksExact('file-via-label', 1);
  });

  test('with visual selection on, the first tap on a button does not run it and the second does', async () => {
    await grid.tap('button-on');
    await grid.tap('button-on');
    await grid.expectClicks('button-on', 1);
    await grid.clickBarrier();
    await grid.expectClicksExact('button-on', 1);
  });

  test('a tap follows a link when visual selection is off', async () => {
    await grid.tap('cell-link');
    await grid.expectClicks('cell-link', 1);
    await grid.clickBarrier();
    await grid.expectClicksExact('cell-link', 1);
  });

  test('a selection-blocked button receives the tap when nothing was selected', async () => {
    await grid.tap('button-blocked');
    await grid.expectClicks('button-blocked', 1);
    await grid.clickBarrier();
    await grid.expectClicksExact('button-blocked', 1);
  });

  test('a selection-blocked button receives the tap when another cell was selected', async () => {
    await grid.tap('button-on');
    await grid.clickBarrier();
    await grid.expectClicksExact('button-on', 0);

    await grid.tap('button-blocked');
    await grid.expectClicks('button-blocked', 1);
    await grid.clickBarrier();
    await grid.expectClicksExact('button-blocked', 1);
  });
});

test.describe('iOS Chrome with visual selection off', () => {
  test.use({ userAgent: IOS_CHROME_UA });

  let grid: TouchInteractiveCellPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    // Linux Chromium keeps `navigator.platform` as Linux. `isIOS()` reads that, not the UA.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'platform', {
        configurable: true,
        get: () => 'iPhone',
      });
    });

    grid = new TouchInteractiveCellPage(page, theme, bundle);
    await grid.goto();
    await grid.installTouchEndLog();
  });

  test('cancels both taps of a double-tap on a text cell', async () => {
    expect(await grid.engineFlags()).toEqual({ ios: true, chromeWebKit: true });

    await expect(grid.control('text-off')).toBeVisible();
    await grid.tap('text-off');
    await grid.tap('text-off');

    await grid.expectTouchEndsPrevented([true, true]);
  });

  test('does not cancel a tap on a button', async () => {
    expect(await grid.engineFlags()).toEqual({ ios: true, chromeWebKit: true });

    await grid.tap('button-off');

    await grid.expectTouchEndsPrevented([false]);
    await grid.expectClicks('button-off', 1);
  });
});
