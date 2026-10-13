import { test, expect } from '../fixtures/test';
import { NestedHeadersGrownWidthsPage } from '../fixtures/pages/NestedHeadersGrownWidthsPage';

/**
 * `NestedHeaders` grows a column to fit a header label wider than its
 * data through its `modifyColWidth` hook, backed by a ghost-table widths map. The engine's column
 * width cache tests only the column COUNT, so it never saw that the widths moved: its totals kept the
 * narrow pre-growth widths while the scroll range used the grown ones. Scrolled to the right edge,
 * the viewport ended on a blank area instead of the last columns.
 *
 * Geometry depends on measured text widths, which read as zero in jsdom, so it is checked here.
 */
test.describe('nested headers that grow the column widths', () => {
  test('scrolled to the right edge, the grid renders its last column', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersGrownWidthsPage(page, theme, bundle);

    await grid.goto();
    await grid.scrollToEnd();

    // Within a pixel of the visible area; the blank area put the cell over a thousand pixels outside it.
    await expect.poll(() => grid.lastColumnOffscreenBy()).toBeLessThanOrEqual(1);
  });
});
