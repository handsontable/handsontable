import { test, expect } from '../../fixtures/test';
import { OverlaysPage } from '../../fixtures/pages/walkontable/OverlaysPage';

/**
 * Walkontable engine E2E via a frozen-panes grid. This is the Playwright home
 * for walkontable — new/flaky walkontable behavior lands here, not in the
 * frozen Jasmine `test/spec/**` suite. Runs under every theme via the
 * per-theme projects.
 */
test.describe('walkontable overlays', { tag: '@walkontable' }, () => {
  let wt: OverlaysPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    wt = new OverlaysPage(page, theme, bundle);
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

  /**
   * The fill handle of the cell at the far edge of the grid is pulled back
   * inside the viewport, so it never enlarges the scrollable area. With frozen
   * panes the master table is shifted by the frozen pane, and missing that
   * shift made the handle hang past the last column/row and grow a scrollbar
   * on the master table alone (#13143).
   */
  test('selecting the last column does not widen the scrollable area', async () => {
    await wt.scrollToEnd();
    const { width } = await wt.scrollSize();

    await wt.selectCell(wt.lastRow - 1, wt.lastColumn);

    await expect.poll(async () => (await wt.scrollSize()).width).toBe(width);
  });

  test('selecting the last row does not heighten the scrollable area', async () => {
    await wt.scrollToEnd();
    const { height } = await wt.scrollSize();

    await wt.selectCell(wt.lastRow, wt.lastColumn - 1);

    await expect.poll(async () => (await wt.scrollSize()).height).toBe(height);
  });
});
