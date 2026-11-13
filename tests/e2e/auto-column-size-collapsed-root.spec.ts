import { test, expect, THEMES_TAG } from '../fixtures/test';
import { AutoColumnSizeCollapsedRootPage } from '../fixtures/pages/AutoColumnSizeCollapsedRootPage';

/**
 * An auto-sized column's measured width must not depend on the width of the grid's root at the
 * moment of measuring. The measuring container copies the root's class names, `ht-wrapper` among
 * them, and `ht-wrapper` is `width: 100%`. With a collapsed root the container was 0px wide, each
 * column's text wrapped to its narrowest width, and the narrow width was cached for good.
 */
test.describe('autoColumnSize and a root that collapses and returns', { tag: THEMES_TAG }, () => {
  let grid: AutoColumnSizeCollapsedRootPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoColumnSizeCollapsedRootPage(page, theme, bundle);
    await grid.goto();
  });

  test('restores the column widths and the row height once the root is wide again', async() => {
    const initial = await grid.measure();

    expect(initial.widths).toHaveLength(4);

    await grid.setBoxWidth(0);
    await expect.poll(() => grid.rootWidth()).toBe(0);
    // The full render while the root is collapsed is what caches the wrapped widths.
    await grid.render();

    await grid.setBoxWidth(600);
    await expect.poll(() => grid.rootWidth()).toBe(600);
    // Back through the grid's own ResizeObserver render only, never a manual render or refresh:
    // either one repairs the grid and would let this test pass without the fix.
    await expect.poll(() => grid.measure()).toEqual(initial);
  });

  test('measures a column wider than its root at its content width', async() => {
    const narrow = await grid.measure('narrowHot');
    const wideRowHeight = (await grid.measure()).rowHeight;

    expect(await grid.rootWidth('narrowHot')).toBe(300);
    // The text of the first column is wider than the 300px root, and it stays on one line.
    expect(narrow.widths[0]).toBeGreaterThan(300);
    expect(narrow.rowHeight).toBe(wideRowHeight);
  });
});
