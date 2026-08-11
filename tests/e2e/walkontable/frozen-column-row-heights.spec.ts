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
  const { TALL_ROW } = FrozenTallCellPage;
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
