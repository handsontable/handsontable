import { test, expect } from '../fixtures/test';
import { ColumnAutosizeRefillPage } from '../fixtures/pages/ColumnAutosizeRefillPage';

/**
 * #6452 / DEV-406: the rendered row band was computed from row heights measured on the previous
 * render. When the rows then shrank (a column autosized wide enough for its wrapped text to fit
 * on one line, or long values replaced by short ones), the grid kept the short band and showed a
 * blank area under the last row until an unrelated scroll forced another draw. The band must be
 * refilled within the same draw.
 */
test.describe('viewport refill after the rendered rows shrink', () => {
  let grid: ColumnAutosizeRefillPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ColumnAutosizeRefillPage(page, theme, bundle);
    await grid.goto();
  });

  test('double-click autosize of a narrow wrapped column fills the viewport with rows', async () => {
    // Precondition: the 40px column makes rows 1-7 tall, so only a few rows fit into 320px.
    // Polled, not read once: AutoColumnSize measures in a deferred batch, so a later render can
    // still be pending when `goto()` resolves.
    await expect.poll(() => grid.columnHeaderWidth(2)).toBeLessThanOrEqual(41);
    await expect.poll(() => grid.renderedRowCount()).toBeLessThanOrEqual(6);

    await grid.autosizeColumnByDoubleClick(2);

    // The autosize itself is not under test, only its consequence — but the assertion below is
    // vacuous if the column did not widen, so pin that first.
    await expect.poll(() => grid.columnHeaderWidth(2)).toBeGreaterThan(200);

    await grid.expectViewportFilled();
  });

  test('replacing the long values with short ones fills the viewport with rows', async () => {
    await expect.poll(() => grid.renderedRowCount()).toBeLessThanOrEqual(6);

    await grid.shortenTexts();

    await grid.expectViewportFilled();
  });
});
