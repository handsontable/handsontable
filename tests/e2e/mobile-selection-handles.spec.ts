import { devices } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { MobileHandlesPage } from '../fixtures/pages/MobileHandlesPage';

/**
 * Regression spec for DEV-2165: the mobile selection handles (the round
 * grab-points on the corners of a selection) disappeared in 18.0 — the
 * handle elements were created but never attached to the DOM.
 *
 * Handsontable creates the handles only when it detects a mobile browser at
 * grid construction time, so the whole spec runs with iPhone emulation
 * (touch + mobile user agent).
 */
test.use({
  ...devices['iPhone 13'],
  browserName: 'chromium',
});

test.describe('mobile selection handles', () => {
  let mobileGrid: MobileHandlesPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    mobileGrid = new MobileHandlesPage(page, theme, bundle);
    await mobileGrid.goto();
  });

  test('appear on the selection corners after tapping a cell', async () => {
    await mobileGrid.tapCell(1, 1);

    await mobileGrid.expectHandlesVisible();
  });

  test('follow the selection when another cell is tapped', async () => {
    await mobileGrid.tapCell(1, 1);
    await mobileGrid.expectHandlesVisible();

    const firstBox = await mobileGrid.topHandle().boundingBox();

    await mobileGrid.tapCell(3, 2);
    await mobileGrid.expectHandlesVisible();

    const secondBox = await mobileGrid.topHandle().boundingBox();

    expect(secondBox).not.toEqual(firstBox);
  });

  test('keep the top handle on the outer corner of a row-0 selection without frozen panes', async () => {
    await mobileGrid.tapCell(0, 0);
    await mobileGrid.expectHandlesVisible();

    await expect.poll(() => mobileGrid.isTopHandleOnCellOuterCorner(0, 0)).toBe(true);
  });

  test('keep the top handle interactive when a range starts at the frozen-pane boundaries', async () => {
    await mobileGrid.goto({ frozen: true });
    await mobileGrid.tapCell(1, 1);
    await mobileGrid.selectRange(1, 1, 3, 3);
    await mobileGrid.expectHandlesVisible();

    await expect.poll(() => mobileGrid.isTopHandleHitAreaAtHandleCenter()).toBe(true);
  });

  test('keep the top handle interactive at the frozen-pane boundaries in RTL', async () => {
    await mobileGrid.goto({ direction: 'rtl', frozen: true });
    await mobileGrid.tapCell(1, 1);
    await mobileGrid.selectRange(1, 1, 3, 3);
    await mobileGrid.expectHandlesVisible();

    await expect.poll(() => mobileGrid.isTopHandleHitAreaAtHandleCenter()).toBe(true);
  });
});
