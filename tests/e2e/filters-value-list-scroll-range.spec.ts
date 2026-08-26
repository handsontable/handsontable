import { test, expect } from '../fixtures/test';
import { MenuScrollPage } from '../fixtures/pages/MenuScrollPage';

/**
 * The "filter by value" list is a nested Handsontable built while the dropdown is still
 * hidden. Its scroll range comes from the summed row heights, and those are derived from
 * `--ht-line-height` and `--ht-cell-vertical-padding` rather than measured off the DOM —
 * so a stylesheet that shortens the list's cells by writing `padding` straight onto the
 * `td` leaves the variable at the theme's value and the list ends up able to scroll past
 * its last item (DEV-2515).
 *
 * `_filters.scss` did exactly that for 20 months. It stayed invisible because the list's
 * styles cache was empty while the dropdown was hidden, so the row height read `null` and
 * the engine measured the DOM instead. Once the cache works, the wrong number is the one
 * that gets used: in horizon the list reported 505px of scroll range for 392px of content.
 *
 * The check is the invariant, not the numbers: every item is one row tall, so the range is
 * the item count times the rendered row height. It holds in every theme.
 */
test.describe('filters by-value list', () => {
  test('scroll range matches the number of items it holds', async({ page, theme, bundle }) => {
    const grid = new MenuScrollPage(page, theme, bundle);

    await grid.goto();
    await grid.openDropdownMenu(1);

    // Polled rather than slept on: `settleFrames()` is a two-frame wait, and the
    // list measures itself over an unspecified number of frames after the menu
    // opens. Waiting for the metrics to become readable removes that exposure and
    // still fails if they never do.
    await expect.poll(async () => {
      const { itemCount, rowHeight } = await grid.readFilterValueListMetrics();

      return itemCount > 0 && rowHeight > 0;
    }).toBe(true);

    const metrics = await grid.readFilterValueListMetrics();

    expect(metrics.itemCount).toBeGreaterThan(0);
    expect(metrics.rowHeight).toBeGreaterThan(0);

    // The row height the engine derives from the theme variables has to be the height the
    // cells actually render at. This is the assertion that catches the padding mismatch in
    // whichever theme carries it: horizon computed 36 for rows rendered at 28.
    expect(metrics.derivedRowHeight).toBe(metrics.rowHeight);

    // Two pixels of tolerance for the list's own top and bottom border, and bounded
    // below too: a range short of its content cannot reach the last item.
    expect(metrics.scrollRange).toBeLessThanOrEqual(metrics.itemCount * metrics.rowHeight + 2);
    expect(metrics.scrollRange).toBeGreaterThanOrEqual(metrics.itemCount * metrics.rowHeight - 2);
  });
});
