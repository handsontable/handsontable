import { test } from '../fixtures/test';
import { SortedRowHeightCachePage } from '../fixtures/pages/SortedRowHeightCachePage';

/**
 * DEV-2823 — the row-height prefix-sum cache went stale after sorting.
 *
 * The cache is keyed by RENDER row, while the heights behind it resolve per PHYSICAL row. Sorting is
 * a pure permutation: it changes the height at nearly every render index but leaves the row COUNT
 * alone, and the count was the only staleness test the cache applied. The stale offsets then made
 * the viewport calculator pick the wrong rows for the scroll position, so the grid rendered short
 * and left blank space below the last rendered row.
 *
 * Regressed in 18.1.0 (17.1.0 and 18.0.0 are clean).
 */
test.describe('Row height cache after sorting (DEV-2823)', () => {
  test('leaves no blank space while scrolling a sorted grid', async({ page, theme, bundle }) => {
    const grid = new SortedRowHeightCachePage(page, theme, bundle);

    await grid.goto();

    // The unsorted grid was never broken - assert it first so a failure here points at the harness
    // (or at some unrelated rendering change) rather than at the sorting regression.
    await grid.expectNoBlankSpaceWhileScrolling(20, 300);

    await grid.sortByText('asc');

    await grid.expectNoBlankSpaceWhileScrolling(20, 300);

    await grid.sortByText('desc');

    await grid.expectNoBlankSpaceWhileScrolling(20, 300);
  });

  test('keeps the grid whole after the sort is cleared and reapplied', async({ page, theme, bundle }) => {
    const grid = new SortedRowHeightCachePage(page, theme, bundle);

    await grid.goto();

    // The reported gesture was four header clicks: asc, desc, cleared, asc. The bug tracks the
    // sorted STATE rather than the click count, so the cleared step has to come back clean too.
    await grid.sortByText('asc');
    await grid.sortByText('desc');

    await page.evaluate(() => {
      (window as unknown as { hot: { getPlugin: (name: string) => { clearSort: () => void } } })
        .hot.getPlugin('columnSorting').clearSort();
    });
    await grid.waitForStableScrollRange();

    await grid.expectNoBlankSpaceWhileScrolling(20, 300);

    await grid.sortByText('asc');

    await grid.expectNoBlankSpaceWhileScrolling(20, 300);
  });
});
