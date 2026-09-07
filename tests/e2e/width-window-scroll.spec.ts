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
    const columnsBefore = await grid.renderedColumns();

    await grid.scrollHolderBy(400);

    const extents = await grid.scrollExtents();
    const inlineStartAfter = await grid.box(grid.inlineStartOverlay);

    expect(extents.holderScrollLeft).toBeGreaterThan(0);
    // The frozen columns stay on the root's start edge.
    expect(Math.abs(inlineStartAfter.x - inlineStartBefore.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(inlineStartAfter.x - rootBefore.x)).toBeLessThanOrEqual(1);

    // The frozen rows scrolled with the columns: a column rendered after the
    // scroll sits at the same x in the top clone and in the master. The probe
    // is the first column the scroll brought in — read from the DOM, because
    // each theme's column widths put a different range behind the same 400px.
    const columnsAfter = await grid.renderedColumns();
    const lastColumnBefore = columnsBefore[columnsBefore.length - 1];
    const [probeColumn] = columnsAfter.filter(column => column > lastColumnBefore);

    expect(probeColumn).toBeGreaterThan(lastColumnBefore);

    const topCell = grid.topCloneCell(0, probeColumn);
    const masterCell = grid.cell(5, probeColumn);

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

  // Split mode sends `getRelativeCellPosition()` down the HOLDER path, because the holder owns one
  // axis. That path subtracts the other axis' scroll position, which is the WINDOW scroll here —
  // and the grid root moves with the page, so the subtraction is pure error. It is what places the
  // resize handles (`manualRowResize` / `manualColumnResize`) over a frozen cell's border.
  test('reports a frozen cell at its real position after a window scroll', async () => {
    const errorBefore = await grid.frozenCellPositionError();

    expect(Math.abs(errorBefore.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(errorBefore.start)).toBeLessThanOrEqual(1);

    await grid.scrollWindowBy(0, 400);

    expect((await grid.scrollExtents()).windowScrollY).toBeGreaterThan(0);

    const errorAfter = await grid.frozenCellPositionError();

    expect(Math.abs(errorAfter.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(errorAfter.start)).toBeLessThanOrEqual(1);
  });

  // A clone that appears AFTER the holder scrolled has to be handed the holder's offset at once:
  // `syncScrollWithMaster` runs on that render-state change, and it used to read both axes off the
  // top overlay's scrolling element — the window here — and give up. The clone then rendered its
  // band from offset 0, a full scroll away from the master, until the next horizontal scroll.
  test('aligns a bottom clone shown after the holder scrolled', async () => {
    await grid.scrollHolderBy(400);
    await grid.updateSettings({ fixedRowsBottom: 2 });

    const [column] = await grid.renderedColumns();
    const masterCell = grid.cell(5, column);
    const bottomCell = grid.bottomCloneCell(199, column);

    await expect(masterCell).toBeVisible();
    await expect(bottomCell).toBeVisible();

    const masterBox = await grid.box(masterCell);
    const bottomBox = await grid.box(bottomCell);

    expect(Math.abs(bottomBox.x - masterBox.x)).toBeLessThanOrEqual(2);
  });

  test('lets a wheel over the frozen rows scroll the page', async () => {
    await grid.wheelOver(grid.topCloneCell(0, 3), 0, 300);

    await expect.poll(async () => (await grid.scrollExtents()).windowScrollY).toBeGreaterThan(0);
  });

  // A trackpad swipe is rarely axis-pure. The grid consumes the horizontal part on the holder and
  // then cancels the event, which used to take the window-owned vertical part down with it: the
  // columns moved, the page did not. Both axes have to move from one event.
  test('lets a diagonal wheel over the frozen rows scroll the page and the columns at once', async () => {
    await grid.wheelOver(grid.topCloneCell(0, 3), 120, 300);

    await expect.poll(async () => (await grid.scrollExtents()).holderScrollLeft).toBeGreaterThan(0);
    await expect.poll(async () => (await grid.scrollExtents()).windowScrollY).toBeGreaterThan(0);
  });

  // The bottom clearance strip (#10370) clears the holder's HORIZONTAL scrollbar, so it has to ask
  // the horizontal axis owner — and in this layout that is the holder while the bottom overlay's own
  // owner is the window. One predicate taken from the vertical owner said "the window's scrollbar" for
  // both strips and published 0, so at the grid's end the frozen bottom rows rested on the holder's
  // bottom edge and painted over its floating scrollbar. The strip is also only wanted ON that edge:
  // mid-page the rows float over live cells, and a strip there is a clipped clone plus a band over
  // nothing. Classic scrollbars take their own space, so nothing may be clipped in that regime (the
  // existing contract of `overlay-scrollbar-clearance.spec.ts`); CI's headless Chromium is floating.
  test('clears the holder\'s horizontal scrollbar under the frozen bottom rows only at the grid\'s end', async () => {
    await grid.updateSettings({ fixedRowsBottom: 2 });

    const atEnd = await grid.bottomEdgeState('end');

    expect(atEnd.windowAtEnd).toBe(true);
    // The frozen columns span the holder's full height here, so they cover the edge in both regimes'
    // terms — that is the precondition that the strip machinery is alive on this layout at all.
    expect(atEnd.coversBottomEdge.frozenColumns).toBe(atEnd.gutterY === 0);

    if (atEnd.gutterY === 0) {
      expect(atEnd.coversBottomEdge.bottomRows).toBe(true);
      expect(atEnd.coversBottomEdge.corner).toBe(true);
      expect(atEnd.clips.bottomRows).toMatch(/inset\(/);
      expect(atEnd.clips.corner).toMatch(/inset\(/);
      expect(atEnd.bands).toBeGreaterThan(0);
    } else {
      expect(atEnd.coversBottomEdge.bottomRows).toBe(false);
      expect(atEnd.clips.bottomRows).toBe('none');
    }

    const midPage = await grid.bottomEdgeState('middle');

    expect(midPage.windowAtEnd).toBe(false);
    expect(midPage.coversBottomEdge.bottomRows).toBe(false);
    expect(midPage.coversBottomEdge.corner).toBe(false);
    expect(midPage.clips.bottomRows).toBe('none');
    expect(midPage.clips.corner).toBe('none');
  });

  // Leaving split mode has to undo its sizing. That mode pins the holder to its owner's box in
  // pixels; the window mode that follows sizes nothing, because the page sizes it — so the pixel
  // width stayed behind and kept the holder at the old box. The stale box also fed the column
  // calculators, which went on rendering the band the holder had been scrolled to.
  test('drops the split-mode holder size when both axes go back to the window', async () => {
    await grid.rebuild({ width: undefined, preventOverflow: 'horizontal' }, '500px');

    expect((await grid.axisOwners()).horizontalByWindow).toBe(false);

    // The band the holder shows before it is scrolled. Read, never hardcoded: each theme sizes the
    // columns differently, so the same holder width holds a different number of them.
    const bandAtRest = await grid.renderedColumns();

    await grid.scrollHolderBy(600);

    const inSplitMode = await grid.holderSizing();
    const bandScrolled = await grid.renderedColumns();

    expect(inSplitMode.width).toMatch(/px$/);
    // The viewport moved clear of where it started — every column on screen is past the last one
    // that was there before. Stronger than "the first index grew", and still theme-independent.
    expect(bandScrolled[0]).toBeGreaterThan(bandAtRest[bandAtRest.length - 1]);

    await grid.updateSettings({ preventOverflow: false });

    expect((await grid.axisOwners()).horizontalByWindow).toBe(true);

    const inWindowMode = await grid.holderSizing();

    expect(inWindowMode.width).toBe('');
    expect(inWindowMode.height).toBe('');
    // Back to the band the grid renders when nothing has scrolled it. The holder now spans the page,
    // so it holds MORE columns than at rest — the start is what says the scroll was let go of, and
    // it is the stale pixel width that used to keep it stuck on the scrolled band.
    expect(inWindowMode.firstColumn).toBe(bandAtRest[0]);
    expect((await grid.renderedColumns()).length).toBeGreaterThan(bandAtRest.length);
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

  test('marks the root with the per-axis scroll classes', async () => {
    const root = await grid.rootState();

    expect(root.classes).toContain('htHasScrollX');
    expect(root.classes).toContain('htVerticallyScrollableByWindow');
    expect(root.classes).not.toContain('htHorizontallyScrollableByWindow');
  });

  // The ordering canary of the width/height unification: `height: 'auto'` must keep every column
  // reachable through the holder. `'auto'` writes no `overflow` shorthand, so the `overflow-x: clip`
  // longhand alone carries this layout through the engine's split mode (root owns the columns, the
  // window owns the rows). It passed before the `'auto'` change too, through the element mode, and
  // fails if core ever drops the longhand or the engine loses the split.
  test('keeps every column reachable with `height: "auto"`', async () => {
    await grid.rebuild({ height: 'auto' });

    const root = await grid.rootState();
    const extents = await grid.scrollExtents();

    expect(root.overflowX).toBe('clip');
    expect(extents.holderScrollWidth).toBeGreaterThan(extents.holderClientWidth);
    expect(extents.documentScrollWidth).toBeLessThanOrEqual(extents.documentClientWidth);

    // Scrolls to the end, not by a fixed distance. `main` and `classic` clamp
    // a 2000px scroll to the end anyway; `horizon`, whose columns are widest,
    // has 2027px of range, so it stopped 27px short — a margin a theme metric
    // change could turn into a miss.
    await grid.scrollHolderToEnd();

    await expect(grid.cell(3, 29)).toBeVisible();
  });

  test('stretches the columns to the root width instead of the page width', async () => {
    // Four columns (well under 500px) grow to fill the root; the plugin never shrinks columns,
    // so a dataset wider than the root would keep its widths and scroll instead.
    const narrowData = Array.from({ length: 50 }, (_, r) => [`R${r + 1}C1`, `R${r + 1}C2`, `R${r + 1}C3`, `R${r + 1}C4`]);

    await grid.rebuild({ stretchH: 'all', data: narrowData });

    const extents = await grid.scrollExtents();
    const rootBox = await grid.rootBox();
    const lastCell = await grid.box(grid.cell(2, 3));

    expect(rootBox.width).toBe(500);
    expect(extents.holderScrollWidth).toBeLessThanOrEqual(extents.holderClientWidth);
    // The last column reaches the root's end edge, not the page's.
    expect(Math.abs((lastCell.x + lastCell.width) - (rootBox.x + rootBox.width))).toBeLessThanOrEqual(2);
  });

  test('moves the horizontal axis to the root when a `width` is set after init', async () => {
    await grid.rebuild({ width: undefined });

    const before = await grid.axisOwners();

    expect(before.horizontalByWindow).toBe(true);

    await grid.updateSettings({ width: 500 });

    const after = await grid.axisOwners();
    const extents = await grid.scrollExtents();

    expect(after.horizontalByWindow).toBe(false);
    expect(after.verticalByWindow).toBe(true);
    expect(extents.holderScrollWidth).toBeGreaterThan(extents.holderClientWidth);

    await grid.scrollHolderBy(400);

    expect((await grid.scrollExtents()).holderScrollLeft).toBeGreaterThan(0);
  });

  // The grid may only swallow a wheel gesture it can answer on every axis the gesture names. Here it
  // owns the columns and the page owns the rows, while `ScrollSync#scrollableElement` is the holder
  // for the whole grid - so a vertical swipe reached the wheel translation, the stray `deltaX` a
  // trackpad always carries scrolled the holder sideways, that counted as "scrolled", and the
  // `preventDefault()` that followed left the page unable to scroll under the pointer at all.
  //
  // Asserted on `defaultPrevented`, which is precisely what the grid decides. The page's own scroll
  // cannot be measured here: Chromium latches one CDP-dispatched wheel to the scroller under the
  // pointer (the holder) and does not chain to the document within that single event, the way a real
  // trackpad's event stream does.
  test('leaves a vertical wheel to the page, despite the trackpad drift on the axis it owns', async () => {
    await grid.watchWheelEvents();
    await grid.wheelOverGrid(240);

    const [gesture] = await grid.wheelLog();

    expect(gesture.deltaY).toBe(240);
    expect(gesture.defaultPrevented).toBe(false);
    // The sideways drift was still applied to the axis the grid does own.
    expect((await grid.scrollExtents()).holderScrollLeft).toBeGreaterThan(0);
  });

  test('still swallows a horizontal-only wheel, which is the axis it owns', async () => {
    // The other half of the rule: with no vertical delta the grid answers the whole gesture, so it
    // consumes it and the page keeps still.
    await grid.watchWheelEvents();
    await grid.wheelOverGrid(0, 160);

    const [gesture] = await grid.wheelLog();

    expect(gesture.defaultPrevented).toBe(true);

    const after = await grid.scrollExtents();

    expect(after.holderScrollLeft).toBeGreaterThan(0);
    expect(after.windowScrollY).toBe(0);
  });

  // The wrapper re-send shape: React and Angular push every option on every commit, so `height`
  // arrives again unchanged while `width` moves from container-driven to definite. `applyRootSize`
  // reports no scroll-owner change for it - it compares the inline HEIGHT, which did not move - so
  // core does not call `updateMainScrollableElements()`. The engine has to catch it on its own:
  // `Overlays#beforeDraw` re-resolves the owners and `ScrollSync#resyncScrollableElementsWithOwners`
  // rebinds the listeners in `afterDraw`, inside this same `updateSettings`. Without that the
  // horizontal listener would stay on the window while the root clips the columns.
  test('re-picks the scroll owner when only `width` moves and `height` is re-sent unchanged', async () => {
    await grid.rebuild({ height: 'auto', width: '100%' });

    expect((await grid.axisOwners()).horizontalByWindow).toBe(true);

    await grid.updateSettings({ height: 'auto', width: 500 });

    expect((await grid.axisOwners()).horizontalByWindow).toBe(false);
    expect((await grid.rootState()).overflowX).toBe('clip');

    // The listeners really did move: scrolling the holder drives the frozen rows with it.
    await grid.scrollHolderBy(400);

    expect((await grid.scrollExtents()).holderScrollLeft).toBeGreaterThan(0);

    // A written-down column index is theme-dependent (see `tests/AGENTS.md`), so read the band the
    // master renders right now and take its middle - the top clone mirrors that same band.
    const columns = await grid.renderedColumns();

    expect(columns.length).toBeGreaterThan(0);

    const column = columns[Math.floor(columns.length / 2)];
    const topBox = await grid.box(grid.topCloneCell(0, column));
    const masterBox = await grid.box(grid.cell(5, column));

    expect(Math.abs(topBox.x - masterBox.x)).toBeLessThanOrEqual(2);
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
