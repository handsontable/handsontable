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
});
