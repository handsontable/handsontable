import { test, expect } from '@playwright/test';
import { WalkontablePage } from '../../fixtures/pages/WalkontablePage';

/**
 * Walkontable engine E2E via a frozen-panes grid. This is the Playwright home
 * for walkontable — new/flaky walkontable behavior lands here, not in the
 * frozen Jasmine `test/spec/**` suite.
 */
test.describe('walkontable overlays', { tag: '@walkontable' }, () => {
  let wt: WalkontablePage;

  test.beforeEach(async ({ page }) => {
    wt = new WalkontablePage(page);
    await wt.goto();
  });

  test('renders the frozen-pane overlay clones', async () => {
    await expect(wt.topOverlay).toBeVisible();
    await expect(wt.inlineStartOverlay).toBeVisible();
    await expect(wt.corner).toBeVisible();
  });

  test('frozen rows stay put while the body scrolls', async () => {
    // The top overlay holds frozen rows across the SCROLLABLE columns (C3+ here,
    // since C1/C2 are frozen and live in the corner). R1C3 is a frozen-row cell
    // in the top overlay: it must stay visible across a vertical scroll.
    const frozenCell = wt.topOverlay.getByText('R1C3', { exact: true }).first();
    await expect(frozenCell).toBeVisible();

    await wt.scrollBy(600);
    await expect.poll(async () => (await wt.scrollOffset()).top).toBeGreaterThan(0);

    // Frozen row is still shown by the top overlay after scrolling; corner too.
    await expect(wt.topOverlay.getByText('R1C3', { exact: true }).first()).toBeVisible();
    await expect(wt.corner).toBeVisible();
  });
});
