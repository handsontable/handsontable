import { devices } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

/**
 * Regression spec: dragging a sheet tab is built on pointer events so it works with a mouse
 * and with touch, but on touch the browser claimed the horizontal gesture for panning and
 * cancelled the pointer stream (`pointerdown` -> `pointermove` -> `pointercancel`) before the
 * drag ever got underway.
 *
 * `page.touchscreen` only taps, so reproducing an actual touch drag needs raw CDP touch events
 * (`Input.dispatchTouchEvent`), which is what a real touchscreen sends the browser.
 */
test.use({
  ...devices['iPhone 13'],
  browserName: 'chromium',
});

test.describe('sheets bar touch drag', () => {
  test('dragging a tab past its neighbour by touch reorders the strip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const names = () => page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab-label'),
    ).map(label => label.textContent));

    expect(await names()).toEqual(['Alpha', 'Beta', 'Gamma']);

    const first = (await bar.tab(0).boundingBox())!;
    const third = (await bar.tab(2).boundingBox())!;

    const startX = first.x + (first.width / 2);
    const startY = first.y + (first.height / 2);
    const midX = first.x + first.width;
    const midY = first.y + (first.height / 2);
    const endX = third.x + (third.width / 2) + 5;
    const endY = third.y + (third.height / 2);

    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY }],
    });
    // Two moves: the first passes the drag threshold, the second carries the tab across --
    // matching the mouse-drag spec this touch spec mirrors.
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: midX, y: midY }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: endX, y: endY }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    await expect.poll(names).toEqual(['Beta', 'Gamma', 'Alpha']);
  });
});
