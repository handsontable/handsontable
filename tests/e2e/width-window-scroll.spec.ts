import { test, expect } from '../fixtures/test';
import { WidthWindowScrollPage } from '../fixtures/pages/WidthWindowScrollPage';

/**
 * A grid with a definite `width` and no `height` scrolls its columns inside
 * its own box while the window scrolls its rows. Each scroll axis has its own
 * owner: the root (which core clips on the horizontal axis only) owns the
 * columns, the window owns the rows. Before per-axis trimming the engine
 * named ONE container for both axes and skipped a single-axis clip, so the
 * columns past the width were hidden with no scrollbar and the documented
 * workaround was "also set `height`".
 */
test.describe('width-only grid: holder scrolls columns, window scrolls rows', () => {
  let grid: WidthWindowScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new WidthWindowScrollPage(page, theme, bundle);
    await grid.goto();
  });

  test('owns the horizontal axis in the root and leaves the vertical one to the window', async () => {
    const owners = await grid.axisOwners();
    const extents = await grid.scrollExtents();

    expect(owners.horizontalByWindow).toBe(false);
    expect(owners.verticalByWindow).toBe(true);
    // The columns overflow the holder, not the page.
    expect(extents.holderScrollWidth).toBeGreaterThan(extents.holderClientWidth);
    expect(extents.documentScrollWidth).toBeLessThanOrEqual(extents.documentClientWidth);
  });

  test('virtualizes both axes', async () => {
    const counts = await grid.renderedCounts();

    expect(counts.rows).toBeLessThan(200);
    expect(counts.rows).toBeGreaterThan(0);
    expect(counts.columns).toBeLessThan(30);
    expect(counts.columns).toBeGreaterThan(0);
  });

  test('keeps the frozen columns pinned and the frozen rows aligned while the holder scrolls', async () => {
    const rootBefore = await grid.box(grid.grid);
    const inlineStartBefore = await grid.box(grid.inlineStartOverlay);

    await grid.scrollHolderBy(400);

    const extents = await grid.scrollExtents();
    const inlineStartAfter = await grid.box(grid.inlineStartOverlay);

    expect(extents.holderScrollLeft).toBeGreaterThan(0);
    // The frozen columns stay on the root's start edge.
    expect(Math.abs(inlineStartAfter.x - inlineStartBefore.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(inlineStartAfter.x - rootBefore.x)).toBeLessThanOrEqual(1);

    // The frozen rows scrolled with the columns: a column rendered after the
    // scroll sits at the same x in the top clone and in the master.
    const topCell = grid.topCloneCell(0, 12);
    const masterCell = grid.cell(5, 12);

    await expect(topCell).toBeVisible();
    await expect(masterCell).toBeVisible();

    const topBox = await grid.box(topCell);
    const masterBox = await grid.box(masterCell);

    expect(Math.abs(topBox.x - masterBox.x)).toBeLessThanOrEqual(2);
  });

  test('pins the frozen rows to the viewport top while the window scrolls', async () => {
    const countBefore = await grid.verticalScrollCount();

    await grid.scrollWindowBy(0, 800);

    const extents = await grid.scrollExtents();
    const topBox = await grid.box(grid.topOverlay);
    const cornerBox = await grid.box(grid.topCorner);
    const counts = await grid.renderedCounts();

    expect(extents.windowScrollY).toBeGreaterThan(0);
    expect(Math.abs(topBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(cornerBox.y)).toBeLessThanOrEqual(1);
    // A row far below the first viewport is rendered now, and the rows are
    // still virtualized – the window scroll is a real vertical scroll.
    await expect(grid.cell(40, 3)).toBeVisible();
    expect(counts.rows).toBeLessThan(200);
    // The vertical scroll hooks fire for the window, not only for the holder.
    expect(await grid.verticalScrollCount()).toBeGreaterThan(countBefore);
  });

  test('mirrors the layout in RTL', async () => {
    await grid.rebuild({ layoutDirection: 'rtl' });

    const owners = await grid.axisOwners();
    const rootBefore = await grid.box(grid.grid);

    expect(owners.horizontalByWindow).toBe(false);
    expect(owners.verticalByWindow).toBe(true);

    // In RTL the horizontal scroll position grows negative.
    await grid.scrollHolderBy(-400);

    const extents = await grid.scrollExtents();
    const inlineStartAfter = await grid.box(grid.inlineStartOverlay);

    expect(extents.holderScrollLeft).toBeLessThan(0);
    expect(extents.documentScrollWidth).toBeLessThanOrEqual(extents.documentClientWidth);
    // The frozen columns stay on the root's start edge, which is the right one.
    expect(Math.abs((inlineStartAfter.x + inlineStartAfter.width) - (rootBefore.x + rootBefore.width)))
      .toBeLessThanOrEqual(1);
  });

  test('keeps the legacy `preventOverflow: "horizontal"` alias on the same layout', async () => {
    await grid.rebuild({ width: undefined, preventOverflow: 'horizontal' }, '500px');

    const owners = await grid.axisOwners();
    const extents = await grid.scrollExtents();

    expect(owners.horizontalByWindow).toBe(false);
    expect(owners.verticalByWindow).toBe(true);
    expect(extents.holderScrollWidth).toBeGreaterThan(extents.holderClientWidth);
    expect(extents.holderClientWidth).toBeLessThanOrEqual(500);

    const countBefore = await grid.verticalScrollCount();

    await grid.scrollWindowBy(0, 600);

    const topBox = await grid.box(grid.topOverlay);

    expect(Math.abs(topBox.y)).toBeLessThanOrEqual(1);
    expect(await grid.verticalScrollCount()).toBeGreaterThan(countBefore);
  });
});
