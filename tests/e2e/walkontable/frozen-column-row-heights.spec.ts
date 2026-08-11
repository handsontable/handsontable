import { test, expect } from '../../fixtures/test';
import { FrozenTallCellPage } from '../../fixtures/pages/walkontable/FrozenTallCellPage';

/**
 * DEV-2193 — a row whose tallest content sits in a frozen (inline-start) column.
 *
 * The master renders a contiguous column band starting at the column under the
 * horizontal scroll offset, so with frozen columns it skips them and never sees
 * that content. Row heights are measured from the rendered DOM, so the master
 * kept the row at its provided height while the inline-start overlay rendered it
 * at its content height, and every row below drifted by the difference.
 */
test.describe('walkontable row heights with frozen columns', { tag: '@walkontable' }, () => {
  const { TALL_ROW, SCROLLABLE_TALL_ROW } = FrozenTallCellPage;
  const ROWS_BELOW = [TALL_ROW, TALL_ROW + 1, TALL_ROW + 2, TALL_ROW + 3];

  let wt: FrozenTallCellPage;

  test.beforeEach(async ({ page, theme }) => {
    wt = new FrozenTallCellPage(page, theme);
    await wt.goto();
  });

  test('the master does not render the frozen columns', async () => {
    // The premise of every assertion below. If this ever stops holding, the rest
    // of this file would pass without exercising anything.
    expect(await wt.masterFirstRenderedColumn()).toBeGreaterThan(0);
  });

  test('gives the row the same height in the master and in the inline-start overlay', async () => {
    const normalHeight = await wt.normalRowHeight();
    const frozenHeight = await wt.rowHeight(wt.inlineStartOverlay, TALL_ROW);

    expect(frozenHeight).toBeGreaterThan(normalHeight);
    expect(await wt.rowHeight(wt.master, TALL_ROW)).toBe(frozenHeight);
  });

  test('keeps the rows below the tall one aligned with the inline-start overlay', async () => {
    for (const row of ROWS_BELOW) {
      expect(await wt.rowOffsetWithinTable(wt.master, row))
        .toBe(await wt.rowOffsetWithinTable(wt.inlineStartOverlay, row));
    }
  });

  test('keeps the rows aligned after scrolling away from the frozen columns', async () => {
    await wt.scrollHorizontallyTo(1500);

    expect(await wt.masterFirstRenderedColumn()).toBeGreaterThan(0);

    for (const row of ROWS_BELOW) {
      expect(await wt.rowOffsetWithinTable(wt.master, row))
        .toBe(await wt.rowOffsetWithinTable(wt.inlineStartOverlay, row));
    }
  });

  test('keeps the frozen row height when the master invalidates the cache in the same draw', async () => {
    const before = await wt.masterScrollHeight();

    // The master discovers a tall cell of its own and drops the row-height cache mid-draw. The
    // rebuild that follows must still know about the frozen row — it is measured later in the same
    // draw, so a rebuild that dropped it would leave the scroll range permanently short, with the
    // rows still LOOKING right because their heights are re-applied from the live records.
    await wt.setTallScrollableCell(true);
    await expect(wt.grid.getByTestId('scrollable-tall-block')).toHaveCount(1);

    const after = await wt.masterScrollHeight();

    expect(after).toBeGreaterThan(before);
    expect(await wt.rowHeight(wt.master, TALL_ROW))
      .toBe(await wt.rowHeight(wt.inlineStartOverlay, TALL_ROW));
  });

  test('keeps a row tall in a SCROLLABLE column aligned across consecutive draws', async () => {
    // This row's height is the master's to own — its tall content is in a column the master renders.
    // The frozen sync must not adopt it: the frozen overlays cannot re-detect a height they never
    // saw, so an adopted record would read as "shrank" on the next draw and be dropped, then be
    // rediscovered by the master on the one after, oscillating every other draw.
    await wt.setTallScrollableCell(true);
    await expect(wt.grid.getByTestId('scrollable-tall-block')).toHaveCount(1);

    const tallHeight = await wt.rowHeight(wt.master, SCROLLABLE_TALL_ROW);

    expect(tallHeight).toBeGreaterThan(await wt.normalRowHeight());

    for (let draw = 0; draw < 4; draw += 1) {
      expect(await wt.rowHeight(wt.master, SCROLLABLE_TALL_ROW)).toBe(tallHeight);
      expect(await wt.rowHeight(wt.inlineStartOverlay, SCROLLABLE_TALL_ROW)).toBe(tallHeight);
      await wt.forceRender();
    }
  });

  test('keeps a row tall in BOTH a frozen and a scrollable column aligned when the frozen part goes', async () => {
    // The frozen height dominates while it is there. When it goes, the row is still tall because of
    // the master's own cell, and every table has to agree on that in the SAME draw — the frozen
    // overlays rendered before the drop was known, just as the master did.
    await wt.goto({ scrollableTallRow: TALL_ROW });
    await wt.setTallScrollableCell(true);

    const bothTall = await wt.rowHeight(wt.master, TALL_ROW);

    expect(await wt.rowHeight(wt.inlineStartOverlay, TALL_ROW)).toBe(bothTall);

    await wt.setTallCell(false);
    await expect(wt.grid.getByTestId('tall-block')).toHaveCount(0);

    const scrollableOnly = await wt.rowHeight(wt.master, TALL_ROW);

    expect(scrollableOnly).toBeLessThan(bothTall);
    expect(scrollableOnly).toBeGreaterThan(await wt.normalRowHeight());
    expect(await wt.rowHeight(wt.inlineStartOverlay, TALL_ROW)).toBe(scrollableOnly);
  });

  test('costs no row-height cache invalidations once the frozen height has settled', async () => {
    // Re-detecting the same frozen height is not a change. Every invalidation also drops the
    // per-draw layout snapshot, and with a non-uniform row-size source it rebuilds the prefix sum
    // over every row in the grid — so a redraw that keeps invalidating is a scroll-speed
    // regression that no visual assertion would ever catch.
    expect(await wt.countRowCacheInvalidations(3)).toBe(0);
  });

  test('settles a row tall in both columns when the SCROLLABLE side is the taller one', async () => {
    // The frozen record is established first, then the master's own content grows past it. The row
    // is now the master's to own again — the frozen overlays measure only the shorter 60px block —
    // so ownership has to move back, or the two sides fight over the record on every single draw:
    // the frozen pass re-records 60, the master re-measures 90, and both invalidate the row-height
    // cache. Nothing about that is visible; every height below stays correct throughout.
    await wt.goto({ scrollableTallRow: TALL_ROW, scrollableTallHeight: 90 });

    const frozenOnly = await wt.rowHeight(wt.master, TALL_ROW);

    await wt.setTallScrollableCell(true);
    await expect(wt.grid.getByTestId('scrollable-tall-block')).toHaveCount(1);

    const bothTall = await wt.rowHeight(wt.master, TALL_ROW);

    expect(bothTall).toBeGreaterThan(frozenOnly);
    expect(await wt.rowHeight(wt.inlineStartOverlay, TALL_ROW)).toBe(bothTall);

    expect(await wt.countRowCacheInvalidations(3)).toBe(0);

    // Still aligned after those redraws, and still the taller of the two heights.
    expect(await wt.rowHeight(wt.master, TALL_ROW)).toBe(bothTall);
    expect(await wt.rowHeight(wt.inlineStartOverlay, TALL_ROW)).toBe(bothTall);
  });

  test('keeps frozen ownership when the tall row is the first row the master renders', async () => {
    // The band's first <tr> carries an extra 1px top border, so this row measures 1px taller than
    // the same row anywhere else. Ownership moves on "the master out-measured the frozen side", and
    // 1px of border is not the master's content — reading it as such would hand the row back to a
    // master that cannot recreate its height, and the two sides would fight over it every draw.
    //
    // It holds because the inline-start clone mirrors the master's row band: the boundary row is the
    // first <tr> in BOTH tables, so both measurements carry the same 1px and neither out-measures
    // the other. This test exists because that is a property of the clone's filters, not of this
    // code, and nothing else here would notice if it changed.
    const BOUNDARY_ROW = 4;

    await wt.goto({ tallRow: BOUNDARY_ROW, rows: 100 });
    await wt.setTallCell(false);
    await wt.scrollToRowAtTop(BOUNDARY_ROW + 1);

    expect(await wt.masterFirstRenderedRow()).toBe(BOUNDARY_ROW);

    // Grow it here, rather than shrinking it: a shrink moves the band and the row stops being the
    // boundary, which is not the case under test.
    await wt.setTallCell(true);

    expect(await wt.masterFirstRenderedRow()).toBe(BOUNDARY_ROW);
    expect(await wt.rowHeight(wt.master, BOUNDARY_ROW))
      .toBe(await wt.rowHeight(wt.inlineStartOverlay, BOUNDARY_ROW));
    expect(await wt.countRowCacheInvalidations(3)).toBe(0);
  });

  test('keeps the panes aligned when the band boundary moves onto an already-tall row', async () => {
    // The band's first <tr> gains a 1px border-top, so a row's total height changes by 1px purely
    // by scrolling onto the boundary. The record holds that total, and the overlay whose content
    // actually needs it cannot render in one pixel less — so a record left on the old side of the
    // flip puts that overlay 1px away from every other table, and every row below it with it.
    //
    // The record has to be established AWAY from the boundary and then have the boundary move onto
    // it. Creating the tall content while already at the boundary measures the right total straight
    // away and hides this entirely.
    const BOUNDARY_ROW = 4;

    await wt.goto({ tallRow: BOUNDARY_ROW, rows: 100 });

    const restingHeight = await wt.rowHeight(wt.master, BOUNDARY_ROW);

    expect(restingHeight).toBeGreaterThan(await wt.normalRowHeight());

    await wt.scrollToRowAtTop(BOUNDARY_ROW + 1);

    expect(await wt.masterFirstRenderedRow()).toBe(BOUNDARY_ROW);
    expect(await wt.rowHeight(wt.master, BOUNDARY_ROW))
      .toBe(await wt.rowHeight(wt.inlineStartOverlay, BOUNDARY_ROW));

    for (const row of [BOUNDARY_ROW + 1, BOUNDARY_ROW + 2, BOUNDARY_ROW + 3]) {
      expect(await wt.rowOffsetWithinTable(wt.master, row))
        .toBe(await wt.rowOffsetWithinTable(wt.inlineStartOverlay, row));
    }

    // And back off the boundary again — the 1px must not be left behind.
    await wt.scrollVerticallyTo(0);

    expect(await wt.rowHeight(wt.master, BOUNDARY_ROW))
      .toBe(await wt.rowHeight(wt.inlineStartOverlay, BOUNDARY_ROW));
  });

  test('keeps the scroll range whole when the BOTTOM clone invalidates the cache mid-draw', async () => {
    // The bottom clone renders, and measures itself, inside `wtOverlays.refresh()` — after the
    // frozen records have been cleared for this draw. An invalidation of its own therefore lands in
    // that window, and the next read rebuilds the prefix sum from an `oversizedRows` the frozen rows
    // are not in yet. Nothing corrects it afterwards: the records come back unchanged, so no
    // invalidation follows them. Every rendered row still looks right; only the scrollbar is short.
    const config = { fixedRowsBottom: 2, scrollableTallRow: 18, rows: 20 };

    await wt.goto(config);

    const settled = await wt.rowHeightSum();

    expect(settled.cached).toBe(settled.live);

    await wt.goto(config);
    // Grows a row the BOTTOM clone owns, so the bottom clone is what invalidates.
    await wt.setTallScrollableCell(true);

    const afterGrow = await wt.rowHeightSum();

    expect(afterGrow.cached).toBe(afterGrow.live);

    await wt.goto(config);
    await wt.setTallScrollableCell(true);
    await wt.setTallScrollableCell(false);

    const afterShrink = await wt.rowHeightSum();

    expect(afterShrink.cached).toBe(afterShrink.live);
  });

  test('reports the visible row range against the heights this draw ended with', async () => {
    // The viewport calculators are built before the frozen overlays render, so a frozen-derived
    // height cannot be in them. An ordinary oversized row never has this problem — the master
    // invalidates inside `renderCellBand`, which is earlier. Left unrebuilt, the range is measured
    // against the previous heights and silently corrects itself on the next draw, so anything
    // asking during this one gets an answer that is off by a row or two.
    await wt.setTallCell(false);

    const withoutTallRow = await wt.visibleRowRange();

    await wt.setTallCell(true);

    const onTheDrawThatGrew = await wt.visibleRowRange();

    await wt.forceRender();

    expect(onTheDrawThatGrew).toBe(await wt.visibleRowRange());
    expect(onTheDrawThatGrew).not.toBe(withoutTallRow);
  });

  test('stays a faithful mirror of RenderSizeProbe, including rows only a corner renders', async () => {
    // The probe independently reproduces `oversizedRows` and is the intended replacement for the
    // engine's own measurement. Heights sourced from tables it does not measure would leave it
    // quietly reproducing a subset — with the characterization spec still green, since it has no
    // frozen-column case.
    const asRecorded = (records: Record<string, { engine: number, probe: number | null }>) =>
      Object.fromEntries(Object.entries(records).map(([row, { engine }]) => [row, engine]));
    const asMeasured = (records: Record<string, { engine: number, probe: number | null }>) =>
      Object.fromEntries(Object.entries(records).map(([row, { probe }]) => [row, probe]));
    const plain = await wt.recordsVersusProbe();

    expect(asMeasured(plain)).toEqual(asRecorded(plain));

    // A tall cell in a frozen TOP row is rendered by the corner alone once the grid has scrolled
    // past it — the row is in no other measured table's band.
    await wt.goto({ fixedRowsTop: 2, tallRow: 0 });
    await wt.scrollVerticallyTo(300);
    await wt.scrollHorizontallyTo(1500);

    const records = await wt.recordsVersusProbe();

    expect(Object.keys(records).length).toBeGreaterThan(0);
    expect(asMeasured(records)).toEqual(asRecorded(records));
  });

  test('records nothing bogus when a merged block sits in the frozen columns', async () => {
    // MergeCells inflates the anchor row's height PER OVERLAY (`modifyRowHeightByOverlayName`), so
    // the frozen clone renders that row at the whole block's height while the overlay-agnostic
    // `getRowHeight` that `markOversizedRows` compares against still reports one row. The inflation
    // does not reach the measurement — it is written on a TD whose `rowspan` covers exactly the rows
    // it accounts for, so no single TR measures tall — but the two sides of that comparison really
    // do disagree, and only this pins the outcome.
    await wt.goto({ mergeInFrozen: 1, rowHeaders: 0, rowHeights: 30 });
    await wt.setTallCell(false);

    expect(await wt.masterFirstRenderedColumn()).toBeGreaterThan(0);

    for (const row of [4, 5]) {
      expect(await wt.rowOffsetWithinTable(wt.master, row))
        .toBe(await wt.rowOffsetWithinTable(wt.inlineStartOverlay, row));
    }

    expect(await wt.countRowCacheInvalidations(3)).toBe(0);
  });

  test('brings the vertical scroll range back in one draw when the frozen cell shrinks', async () => {
    const tallScrollHeight = await wt.masterScrollHeight();

    await wt.setTallCell(false);
    await expect(wt.grid.getByTestId('tall-block')).toHaveCount(0);

    const afterShrink = await wt.masterScrollHeight();

    // A second draw must not change anything: the draw that shrank the row has to re-size the
    // overlay elements itself. The scroll range is summed from the row heights rather than measured
    // off the rendered table, so a missed resize leaves the scrollbar sized for the tall row.
    await wt.forceRender();

    expect(afterShrink).toBe(await wt.masterScrollHeight());
    expect(afterShrink).toBeLessThan(tallScrollHeight);
  });

  test('shrinks the row back once the frozen cell no longer holds tall content', async () => {
    const normalHeight = await wt.normalRowHeight();

    expect(await wt.rowHeight(wt.master, TALL_ROW)).toBeGreaterThan(normalHeight);

    await wt.setTallCell(false);
    await expect(wt.grid.getByTestId('tall-block')).toHaveCount(0);

    // The recorded height must not ratchet: the row is a normal row again in both
    // the master and the overlay that used to hold the tall content.
    expect(await wt.rowHeight(wt.master, TALL_ROW)).toBe(normalHeight);
    expect(await wt.rowHeight(wt.inlineStartOverlay, TALL_ROW)).toBe(normalHeight);
  });

  test.describe('when the tall frozen cell is in a frozen top row', () => {
    // Frozen top rows leave the master's band once the grid is scrolled down. The inline-start clone
    // mirrors that band, so it does not render them either — only the top-inline-start corner does.
    // The corner is therefore the ONLY table that can measure this row.
    const FROZEN_TOP_ROW = 0;
    // The other frozen top row — a normal row, and the baseline, since the usual one has left the
    // master's band by the time this test measures.
    const PLAIN_TOP_ROW = 1;

    test.beforeEach(async () => {
      await wt.goto({ fixedRowsTop: 2, tallRow: FROZEN_TOP_ROW });
      await wt.scrollVerticallyTo(300);
      await wt.scrollHorizontallyTo(1500);
    });

    test('keeps the frozen top row aligned between the top overlay and its corner', async () => {
      // The premises: the master skips the frozen columns, AND it has scrolled past the frozen top
      // rows, so the inline-start clone (which mirrors the master's band) does not render them
      // either. That leaves the corner as the only table holding the tall cell.
      expect(await wt.masterFirstRenderedColumn()).toBeGreaterThan(0);
      expect(await wt.masterFirstRenderedRow()).toBeGreaterThan(PLAIN_TOP_ROW);

      const cornerHeight = await wt.rowHeight(wt.topInlineStartCorner, FROZEN_TOP_ROW);
      const topHeight = await wt.rowHeight(wt.topOverlay, FROZEN_TOP_ROW);

      expect(cornerHeight).toBeGreaterThan(await wt.rowHeight(wt.topInlineStartCorner, PLAIN_TOP_ROW));
      expect(topHeight).toBe(cornerHeight);
    });
  });
});
