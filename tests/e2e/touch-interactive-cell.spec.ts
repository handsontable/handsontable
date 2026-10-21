import { devices } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { TouchInteractiveCellPage } from '../fixtures/pages/TouchInteractiveCellPage';

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

  test('on iOS Chrome, both taps on a text cell with visual selection off cancel touchend', async () => {
    await grid.stubIosWebKit('chrome');

    expect(await grid.touchEndOnCell(1, 0)).toBe(true);
    expect(await grid.touchEndOnCell(1, 0)).toBe(true);
  });

  test('on iOS Firefox, both taps on a text cell with visual selection off cancel touchend', async () => {
    await grid.stubIosWebKit('firefox');

    expect(await grid.touchEndOnCell(1, 0)).toBe(true);
    expect(await grid.touchEndOnCell(1, 0)).toBe(true);
  });

  test('on iOS Chrome, a control still receives the tap when visual selection is off', async () => {
    await grid.stubIosWebKit('chrome');

    await grid.tap('button-off');
    await grid.expectClicks('button-off', 1);
    await grid.tap('file-input');
    await grid.expectClicks('file-input', 1);
    await grid.tap('file-label-text');
    await grid.expectClicks('file-via-label', 1);
    await grid.tap('cell-link');
    await grid.expectClicks('cell-link', 1);
  });
});
