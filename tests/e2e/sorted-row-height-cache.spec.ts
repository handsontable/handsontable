import { test, expect } from '../fixtures/test';
import { SortedRowHeightCachePage } from '../fixtures/pages/SortedRowHeightCachePage';

/**
 * DEV-2823 — the axis size caches went stale when an index mapper rearranged an axis.
 *
 * `Viewport#rowHeightCache` / `#columnWidthCache` are prefix sums keyed by RENDER index, while the
 * sizes behind them resolve per PHYSICAL index. `PositionCache#isCurrent()` only re-checks the item
 * COUNT, so it cannot see an update that changes which physical index each render index points at
 * while the count stays the same. The stale offsets then make the viewport calculator pick the wrong
 * band, so the grid renders short and leaves blank space past the last rendered row.
 *
 * Regressed in 18.1.0 (17.1.0 and 18.0.0 are clean).
 */
test.describe('Axis size caches after an index rearrangement (DEV-2823)', () => {
  test('leaves no blank space while scrolling a sorted grid', async({ page, theme, bundle }) => {
    const grid = new SortedRowHeightCachePage(page, theme, bundle);

    await grid.goto();

    // Precondition. The bug needs rows whose heights genuinely differ — if the text stopped
    // wrapping, every row would be the default height, a stale cache would agree with a fresh one,
    // and every assertion below would pass on unfixed code.
    const before = await grid.rowHeights(8);

    expect(Math.max(...before) - Math.min(...before)).toBeGreaterThan(40);

    // The unsorted grid was never broken - assert it first so a failure here points at the harness
    // rather than at the regression.
    await grid.expectNoBlankSpaceWhileScrolling(8, 400);

    await grid.sortByText('asc');

    // Precondition. The sort has to have actually reordered the rows, or there is no rearrangement
    // for the cache to be stale about.
    expect(await grid.rowHeights(8)).not.toEqual(before);

    await grid.expectNoBlankSpaceWhileScrolling(8, 400);

    await grid.sortByText('desc');

    await grid.expectNoBlankSpaceWhileScrolling(8, 400);
  });

  test('leaves no blank space after sorting from the column header', async({ page, theme, bundle }) => {
    const grid = new SortedRowHeightCachePage(page, theme, bundle);

    await grid.goto();

    // The reported gesture was repeated header clicks, and since #13184 that path sorts on mouse UP
    // over the header label only. Driving it here keeps the click route covered alongside the API
    // route the other specs use, so a regression that only reproduces through it cannot ship green.
    await grid.sortByHeaderClick();
    await grid.expectNoBlankSpaceWhileScrolling(8, 400);

    await grid.sortByHeaderClick();
    await grid.expectNoBlankSpaceWhileScrolling(8, 400);
  });

  // The 2px tolerance is the first rendered row's 1px border-top compensation, not slack: a stale
  // cache drifts by hundreds of pixels (120px on a same-count hide swap, 820px on a sort, 617px on
  // a column move, all measured on the unfixed build), so the two cannot be confused.
  test('keeps the cached row offsets true after a sort and after a same-count hide swap', async({ page, theme, bundle }) => {
    const grid = new SortedRowHeightCachePage(page, theme, bundle);

    await grid.goto();

    expect(Math.abs(await grid.offsetDrift('row', 12))).toBeLessThanOrEqual(2);

    // A sort is a pure permutation: it changes the height at nearly every render index while the
    // row count stays put, so the cache's own count check cannot notice.
    await grid.sortByText('asc');

    expect(Math.abs(await grid.offsetDrift('row', 12))).toBeLessThanOrEqual(2);

    // Hiding a row on its own changes how many rows are renderable, so this step self-invalidates
    // through the count and proves nothing on its own. It is here to put row 3 out of view so the
    // swap below has something to bring back.
    await grid.hideRow(3);
    await grid.waitForStableScrollRange();

    expect(Math.abs(await grid.offsetDrift('row', 12))).toBeLessThanOrEqual(2);

    // This is the case under test: hide row 9 and show row 3 together, so WHICH rows are excluded
    // changes while HOW MANY does not. It is the shape the first version of this fix missed, being
    // gated on `indexesSequenceChanged`.
    const countBefore = await grid.renderableRowCount();

    await grid.swapHiddenRows(9, 3);
    await grid.waitForStableScrollRange();

    // Precondition, not decoration. If the swap ever stops being same-count, the cache invalidates
    // on the count instead and the assertion below would pass with the hidden/trimmed gate removed.
    expect(await grid.renderableRowCount()).toBe(countBefore);

    expect(Math.abs(await grid.offsetDrift('row', 12))).toBeLessThanOrEqual(2);
  });

  test('keeps the cached column offsets true after a column move', async({ page, theme, bundle }) => {
    const grid = new SortedRowHeightCachePage(page, theme, bundle);

    await grid.goto();

    expect(Math.abs(await grid.offsetDrift('column', 1))).toBeLessThanOrEqual(2);

    // Moving a column carries its width to a new render index while the column count stays put —
    // the width axis's version of the same defect.
    await grid.moveColumn(0, 1);

    expect(Math.abs(await grid.offsetDrift('column', 1))).toBeLessThanOrEqual(2);
  });
});
