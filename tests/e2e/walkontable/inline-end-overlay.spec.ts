import { test, expect } from '../../fixtures/test';
import { InlineEndOverlayPage } from '../../fixtures/pages/walkontable/InlineEndOverlayPage';

/**
 * The Walkontable overlays of `fixedColumnsEnd`: `inline_end` and its two corners. The columns are the LAST
 * ones of the grid and stay on the inline-end edge (the right in LTR, the left in RTL) while the rest scrolls.
 *
 * Geometry is asserted against the holder's client box rather than a pixel constant, so the same spec holds
 * for a classic scrollbar (the CI runners) and a floating one (macOS). Nothing here depends on paint order:
 * the assertions read coordinates and the API, never `elementFromPoint`.
 */
const TOLERANCE = 1;

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';

  test.describe(`walkontable inline-end overlay (${direction})`, { tag: '@walkontable' }, () => {
    let wt: InlineEndOverlayPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      wt = new InlineEndOverlayPage(page, theme, bundle);
    });

    /**
     * The inline-end edge of a box: the edge the end columns' outer side must sit on (the holder's client box
     * for the end overlay's box).
     */
    const inlineEndEdge = (box: { left: number, right: number }) => (rtl ? box.left : box.right);

    test('renders only the last columns, and no row headers', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 3 });

      await expect(wt.endOverlay.locator('tbody tr').first().locator('td')).toHaveCount(3);
      await expect(wt.endOverlay.locator('tbody th')).toHaveCount(0);
      expect(await wt.firstRowTexts(wt.endOverlay)).toEqual(['R1C28', 'R1C29', 'R1C30']);
    });

    test('keeps the end columns on the inline-end edge while the grid scrolls sideways', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 3 });

      const edge = async () => inlineEndEdge(await wt.box(wt.endOverlay));
      const expected = async () => inlineEndEdge(await wt.holderClientBox());

      expect(Math.abs(await edge() - await expected())).toBeLessThanOrEqual(TOLERANCE);

      const maxScroll = await wt.maxScrollLeft();

      for (const left of [maxScroll / 2, maxScroll]) {
        // Sampled on every frame after the scroll: a one-frame lag of the clone shows as a drift.
        expect(await wt.endEdgeDriftOverFrames({ left, scroller: 'holder', frames: 10 })).toBeLessThanOrEqual(TOLERANCE);
        await expect.poll(async () => (await wt.holder().evaluate(h => Math.abs(h.scrollLeft)))).toBeGreaterThan(0);
        expect(Math.abs(await edge() - await expected())).toBeLessThanOrEqual(TOLERANCE);
      }
    });

    test('leaves the last scrollable column fully visible beside the end columns at the end of the scroll', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 3 });

      await wt.scrollTo({ left: await wt.maxScrollLeft() });

      const lastScrollable = wt.cellIn(wt.master, 0, 26);

      await expect(lastScrollable).toBeVisible();

      const cell = await wt.box(lastScrollable);
      const overlay = await wt.box(wt.endOverlay);

      // The cell ends where the end columns begin: not under them, and not short of them.
      const gap = rtl ? cell.left - overlay.right : overlay.left - cell.right;

      expect(Math.abs(gap)).toBeLessThanOrEqual(TOLERANCE);
    });

    test('follows the vertical scroll of the grid row by row', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 3 });
      await wt.scrollTo({ top: 400 });

      await expect.poll(() => wt.holder().evaluate(h => h.scrollTop)).toBeGreaterThan(0);

      const firstVisibleRow = () => wt.page.evaluate(() => (window as unknown as {
        hot: { view: { _wt: { wtScroll: { getFirstVisibleRow(): number } } } }
      }).hot.view._wt.wtScroll.getFirstVisibleRow());

      // The scroll position changes before the engine draws the rows it brings into view, so wait until the
      // engine reports the scrolled rows. A comparison of the unscrolled ones would prove nothing.
      await expect.poll(firstVisibleRow).toBeGreaterThan(0);

      // The row is read again on every attempt, so the cells that are compared always belong to the rows the
      // engine has drawn by then.
      await expect(async () => {
        const row = (await firstVisibleRow()) + 2;

        await expect(wt.cellIn(wt.endOverlay, row, 29)).toBeVisible({ timeout: 1000 });
        await expect(wt.cellIn(wt.master, row, 5)).toBeVisible({ timeout: 1000 });

        const end = await wt.box(wt.cellIn(wt.endOverlay, row, 29));
        const scrollable = await wt.box(wt.cellIn(wt.master, row, 5));

        expect(Math.abs(end.top - scrollable.top)).toBeLessThanOrEqual(TOLERANCE);
        expect(Math.abs(end.bottom - scrollable.bottom)).toBeLessThanOrEqual(TOLERANCE);
      }).toPass({ timeout: 10000 });
    });

    test('stands the corners at the corners of the end overlay, on the edges of the top and bottom overlays', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

      const end = await wt.box(wt.endOverlay);
      const topCorner = await wt.box(wt.topEndCorner);
      const bottomCorner = await wt.box(wt.bottomEndCorner);
      const top = await wt.box(wt.grid.locator('.ht_clone_top'));
      const bottom = await wt.box(wt.grid.locator('.ht_clone_bottom'));
      const inlineEdge = (box: { left: number, right: number }) => (rtl ? box.left : box.right);

      // Same inline-end edge and width as the end overlay they extend.
      expect(Math.abs(inlineEdge(topCorner) - inlineEdge(end))).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(inlineEdge(bottomCorner) - inlineEdge(end))).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs((topCorner.right - topCorner.left) - (end.right - end.left))).toBeLessThanOrEqual(TOLERANCE);
      // The top corner hangs from the top overlay's top edge, the bottom one rests on the bottom overlay's bottom.
      expect(Math.abs(topCorner.top - top.top)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(bottomCorner.bottom - bottom.bottom)).toBeLessThanOrEqual(TOLERANCE);
    });

    test('leaves the middle to the scrollable columns when both edges are frozen', async () => {
      await wt.goto({ rtl, fixedColumnsStart: 2, fixedColumnsEnd: 2 });

      const holder = await wt.holderClientBox();
      const start = await wt.box(wt.startOverlay);
      const end = await wt.box(wt.endOverlay);
      const startEdge = rtl ? start.right : start.left;
      const endEdge = rtl ? end.left : end.right;

      // The start columns stand on the inline-start edge, the end columns on the inline-end one.
      expect(Math.abs(endEdge - (rtl ? holder.left : holder.right))).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(startEdge - (rtl ? holder.right : holder.left))).toBeLessThanOrEqual(TOLERANCE);
      // ... and they do not overlap.
      expect(rtl ? end.right <= start.left + TOLERANCE : end.left >= start.right - TOLERANCE).toBe(true);

      await wt.scrollTo({ left: await wt.maxScrollLeft() });
      await expect.poll(async () => {
        const box = await wt.box(wt.endOverlay);

        return Math.abs((rtl ? box.left : box.right) - (rtl ? holder.left : holder.right));
      }).toBeLessThanOrEqual(TOLERANCE);
    });

    test('is created, removed and created again by updateSettings', async () => {
      await wt.goto({ rtl });

      await expect(wt.endOverlay.locator('tbody td')).toHaveCount(0);

      await wt.updateSettings({ fixedColumnsEnd: 2 });
      await expect(wt.endOverlay.locator('tbody tr').first().locator('td')).toHaveCount(2);

      await wt.updateSettings({ fixedColumnsEnd: 0 });
      await expect(wt.endOverlay.locator('tbody td')).toHaveCount(0);

      await wt.updateSettings({ fixedColumnsEnd: 4 });
      await expect(wt.endOverlay.locator('tbody tr').first().locator('td')).toHaveCount(4);
    });

    test('is destroyed with the grid', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 1, fixedRowsBottom: 1 });
      await expect(wt.endOverlay).toHaveCount(1);

      await wt.destroy();

      await expect(wt.page.locator('.ht_clone_inline_end, .ht_clone_top_inline_end_corner, ' +
        '.ht_clone_bottom_inline_end_corner')).toHaveCount(0);
    });

    test('cuts the end columns down to what the start columns leave', async () => {
      await wt.goto({ rtl, fixedColumnsStart: 2 });

      // The start band has priority: 28 + 5 > 30, so only the two remaining columns are frozen at the end.
      await wt.updateSettings({ fixedColumnsStart: 28, fixedColumnsEnd: 5 });
      await expect(wt.endOverlay.locator('tbody tr').first().locator('td')).toHaveCount(2);
      expect(await wt.firstRowTexts(wt.endOverlay)).toEqual(['R1C29', 'R1C30']);

      // Fully covered by the start band: no end columns at all.
      await wt.updateSettings({ fixedColumnsStart: 30, fixedColumnsEnd: 5 });
      await expect(wt.endOverlay.locator('tbody td')).toHaveCount(0);
    });

    test('resolves the topmost cell of every region to its own overlay', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

      expect(await wt.topmostOverlayOf(0, 29)).toBe('top_inline_end_corner');
      expect(await wt.topmostOverlayOf(5, 29)).toBe('inline_end');
      expect(await wt.topmostOverlayOf(39, 29)).toBe('bottom_inline_end_corner');
      expect(await wt.topmostOverlayOf(0, 5)).toBe('top');
      expect(await wt.topmostOverlayOf(39, 5)).toBe('bottom');
    });

    test('selects the cell that is clicked in the end columns', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 1, fixedRowsBottom: 1 });

      await wt.cellIn(wt.endOverlay, 5, 29).click();
      expect(await wt.selectedRange()).toEqual([5, 29, 5, 29]);

      await wt.cellIn(wt.endOverlay, 8, 28).click();
      expect(await wt.selectedRange()).toEqual([8, 28, 8, 28]);
    });

    test('names the cells of the end columns by their place in the grid, in every region', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2, fixedRowsTop: 1, fixedRowsBottom: 1 });

      // The corners are asked for their coordinates, not clicked: that keeps the test off the paint order.
      for (const [row, col, overlay] of [
        [0, 28, wt.topEndCorner],
        [0, 29, wt.topEndCorner],
        [5, 28, wt.endOverlay],
        [5, 29, wt.endOverlay],
        [39, 28, wt.bottomEndCorner],
        [39, 29, wt.bottomEndCorner],
      ] as const) {
        expect(await wt.coordsOf(wt.cellIn(overlay, row, col))).toEqual({ row, col });
      }
    });

    test('draws one handle per edge of a selection that crosses into the end columns', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2 });
      // Not the last column: an edge flush with the grid boundary gets no handle at all.
      await wt.selectRange(3, 24, 6, 28);
      await wt.scrollTo({ left: await wt.maxScrollLeft() });
      // The handles show while the pointer is over the selection.
      await wt.cellIn(wt.master, 4, 25).hover();

      await expect.poll(() => wt.visibleHandles('end')).toBe(1);
      expect(await wt.visibleHandles('start')).toBe(1);
      expect(await wt.visibleHandles('top')).toBe(1);
      expect(await wt.visibleHandles('bottom')).toBe(1);
      // The end edge of the selection is the end overlay's.
      await expect(wt.endOverlay.locator('.wtSelectionHandle--end:visible')).toHaveCount(1);
    });

    test('hides the handle of an edge that lies on the freeze line', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2 });

      // Ends on the last scrollable column: its end edge is the freeze line.
      await wt.selectRange(3, 24, 6, 27);
      await wt.scrollTo({ left: await wt.maxScrollLeft() });
      await wt.cellIn(wt.master, 4, 25).hover();
      await expect.poll(() => wt.visibleHandles('start')).toBe(1);
      expect(await wt.visibleHandles('end')).toBe(0);

      // Starts on the first end column: its start edge is the freeze line.
      await wt.selectRange(3, 28, 6, 28);
      await wt.cellIn(wt.endOverlay, 4, 28).hover();
      await expect.poll(() => wt.visibleHandles('end')).toBe(1);
      expect(await wt.visibleHandles('start')).toBe(0);
    });
  });
}

test.describe('walkontable inline-end overlay (window scroll)', { tag: '@walkontable' }, () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    const rtl = direction === 'rtl';

    test(`holds the end columns at the viewport edge while the page scrolls sideways (${direction})`,
      async ({ page, theme, bundle }) => {
        const wt = new InlineEndOverlayPage(page, theme, bundle);

        await wt.goto({ rtl, windowScroll: true, fixedColumnsEnd: 2 });

        // The page scrolls sideways towards the inline end: the browser scrolls by the compositor, so the clone
        // must hold the viewport edge on every frame, not only on the first sample that happens to match.
        expect(await wt.endEdgeDriftOverFrames({ left: 0, scroller: 'window', frames: 3 })).toBeLessThanOrEqual(TOLERANCE);
        expect(await wt.endEdgeDriftOverFrames({ left: 400, scroller: 'window', frames: 10 })).toBeLessThanOrEqual(TOLERANCE);
        await expect.poll(() => page.evaluate(() => Math.abs(window.scrollX))).toBeGreaterThan(0);
      });
  }
});
