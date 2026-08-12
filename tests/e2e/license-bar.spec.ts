import { test, expect } from '../fixtures/test';
import { LicenseBarPage } from '../fixtures/pages/LicenseBarPage';

const LICENSE_BAR_MIN_WIDTH = 300;

/**
 * DEV-2192: the license notification bar takes its width from the grid
 * (DEV-1108), so on narrow grids its content — most notably the unbreakable
 * support e-mail address — used to overflow the bar. The bar now enforces a
 * minimum width and the bottom slot scrolls the excess horizontally.
 */
test.describe('license notification bar on a narrow grid', () => {
  let licenseBar: LicenseBarPage;

  test.beforeEach(async ({ page, theme }) => {
    licenseBar = new LicenseBarPage(page, theme);
  });

  for (const gridWidth of [100, 150, 299]) {
    test(`keeps its minimum width and scrolls within the slot at grid width ${gridWidth}px`, async () => {
      await licenseBar.goto(gridWidth);

      // The bar never shrinks below its minimum width, so its content fits
      // inside the bar's own box.
      expect(await licenseBar.barWidthPx()).toBeGreaterThanOrEqual(LICENSE_BAR_MIN_WIDTH);
      expect(await licenseBar.barContentOverflowPx()).toBe(0);

      // The grid is narrower than the bar, so the slot must scroll the excess
      // instead of clipping it or letting it spill outside the grid.
      const { hiddenContentPx, scrollsHorizontally } = await licenseBar.slotOverflowState();

      expect(hiddenContentPx).toBeGreaterThan(0);
      expect(scrollsHorizontally).toBe(true);
    });
  }

  test('does not scroll when the grid is at least as wide as the bar minimum width', async () => {
    await licenseBar.goto(400);

    expect(await licenseBar.barContentOverflowPx()).toBe(0);

    const { hiddenContentPx } = await licenseBar.slotOverflowState();

    expect(hiddenContentPx).toBe(0);
  });
});
