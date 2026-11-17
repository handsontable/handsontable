import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FixedRowsBottomLinePage } from '../fixtures/pages/FixedRowsBottomLinePage';

/**
 * The freeze line at the top edge of the bottom clone is one border high wherever a scrolling row ends on it:
 * the clone's first row draws it, one pixel above the height the row calculators count, so the bottom border
 * of a row that a keyboard move or a bottom snap lines up with the bottom rows lies under it. A selection on
 * such a row covers the line's pixel like any gridline, and its fill handle stays above the bottom rows.
 * Measured as computed border widths, box geometry and hit tests on every theme leg, in LTR and RTL.
 */
const ROWS = 40;
const COLS = 12;
const LAST_SCROLLABLE_ROW = ROWS - 2;

for (const rtl of [false, true]) {
  const direction = rtl ? 'RTL' : 'LTR';

  test.describe(`fixedRowsBottom freeze line under a lined-up row (${direction})`, { tag: ['@core', THEMES_TAG] }, () => {
    let grid: FixedRowsBottomLinePage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedRowsBottomLinePage(page, theme, bundle);
      await grid.open({ rtl, rows: ROWS, cols: COLS, fixedRowsBottom: 1 });
    });

    test('is one border high at the maximum scroll, drawn by the clone over the last scrolling row', async () => {
      await grid.scrollToEnd(LAST_SCROLLABLE_ROW);

      expect(await grid.masterRowEndsAtLine()).toBe(true);
      expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
    });

    test('is one border high where a bottom snap ends a scrolling row on the bottom rows mid-scroll', async () => {
      await grid.scrollRowToBandEdge(20);

      // Precondition: a master row really ends at the line, so two borders could meet there.
      expect(await grid.masterRowEndsAtLine()).toBe(true);
      expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
    });

    test('is one border high under a row the down arrow lines up with the bottom rows', async () => {
      const row = await grid.arrowToBandEdge(1, 2);

      // Precondition: the arrow key scrolled the grid, and the selected row is not the last scrollable one.
      expect(row).toBeGreaterThan(1);
      expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
      expect(await grid.masterRowEndsAtLine()).toBe(true);
      expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
    });

    test('draws the selection edge on the line and keeps the fill handle above the bottom rows', async () => {
      const row = await grid.arrowToBandEdge(1, 2);

      expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
      expect(await grid.masterRowEndsAtLine()).toBe(true);

      // Like at any gridline: the line pixel is the selection's (drawn by the bottom clone over itself), and so
      // is the pixel above it (the master's edge). The fill handle is on top, and at most the empty margin row
      // of its box reaches the line.
      await expect.poll(() => grid.bottomEdgeAcrossLine(row, 2)).toEqual({
        onLine: expect.stringMatching(/^ht_clone_bottom\/div\.wtBorder current/),
        inside: expect.stringMatching(/^(ht_master|ht_clone_bottom)\/div\.wtBorder current/),
        handleOnTop: true,
        handleAboveBand: true,
      });
    });

    test('keeps a custom bottom border of a row the down arrow lines up with the bottom rows in view', async () => {
      const row = await grid.arrowToBandEdge(1, 2);

      await grid.addCustomBottomBorder(row, 2);

      // The row is still lined up after the settings update, or the two checks below would hold for any row.
      expect(await grid.masterRowEndsAtLine()).toBe(true);
      // No frozen overlay draws a custom border, so its edge stays off the pixel the bottom clone covers.
      await expect.poll(() => grid.customBottomBorderAgainstBand()).toEqual({ height: 1, underBand: 0 });
      expect(await grid.customBottomBorderOffGridline(row, 2)).toBe(-1);
    });
  });
}

test.describe('fixedRowsBottom freeze line around the lined-up state', { tag: ['@core', THEMES_TAG] }, () => {
  let grid: FixedRowsBottomLinePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedRowsBottomLinePage(page, theme, bundle);
  });

  test('draws the edge of a range on the line and keeps its fill handle above the bottom rows', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1 });

    const row = await grid.arrowToBandEdge(1, 2);

    // A range that ends on the lined-up row: its bottom edge and its fill handle are the `area` border's.
    await grid.selectRange(row - 2, 2, row, 2);

    expect(await grid.masterRowEndsAtLine()).toBe(true);
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 2)).toEqual({
      onLine: expect.stringMatching(/^ht_clone_bottom\/div\.wtBorder area/),
      inside: expect.stringMatching(/^(ht_master|ht_clone_bottom)\/div\.wtBorder area/),
      handleOnTop: true,
      handleAboveBand: true,
    });
  });

  test('draws the line pixel of a cell in a frozen start column in the bottom start corner', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, fixedColumnsStart: 2 });

    const row = await grid.arrowToBandEdge(1, 0);

    expect(await grid.masterRowEndsAtLine()).toBe(true);
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 0)).toMatchObject({
      onLine: expect.stringMatching(/^ht_clone_bottom_inline_start_corner\/div\.wtBorder current/),
      handleOnTop: true,
      handleAboveBand: true,
    });
  });

  test('draws the edge of a range across the frozen start columns on the line in both parts', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, fixedColumnsStart: 2 });

    const row = await grid.arrowToBandEdge(1, 0);

    // Column 1 is frozen, columns 2 and 3 scroll.
    await grid.selectRange(row, 1, row, 3);

    expect(await grid.masterRowEndsAtLine()).toBe(true);
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 1)).toMatchObject({
      onLine: expect.stringMatching(/^ht_clone_bottom_inline_start_corner\/div\.wtBorder (current|area)/),
    });
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 3)).toMatchObject({
      onLine: expect.stringMatching(/^ht_clone_bottom\/div\.wtBorder area/),
      handleOnTop: true,
      handleAboveBand: true,
    });
  });

  test('gives the line back to the bottom rows when the grid scrolls on', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1 });

    const row = await grid.arrowToBandEdge(1, 2);

    // Precondition: the bottom clone draws the selection's line pixel.
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 2)).toMatchObject({
      onLine: expect.stringMatching(/^ht_clone_bottom\/div\.wtBorder current/),
    });

    await grid.scrollDownBy(5);

    // The row no longer ends on the line, so the line's pixel is the bottom row's own border again.
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 2)).toMatchObject({
      onLine: expect.stringMatching(/^ht_clone_bottom\/td/),
    });
  });

  test('gives the line back to the bottom rows when the selection moves up a row', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1 });

    const row = await grid.arrowToBandEdge(1, 2);
    const scrollTop = await grid.scrollTop();

    await grid.page.keyboard.press('ArrowUp');

    // The grid did not scroll, so the row the selection left still ends on the line, with no selection on it.
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 2)).toMatchObject({
      onLine: expect.stringMatching(/^ht_clone_bottom\/td/),
      handleOnTop: true,
    });
    expect(await grid.scrollTop()).toBe(scrollTop);
    expect(await grid.masterRowEndsAtLine()).toBe(true);
  });

  test('draws the edge on the line in the same draw that freezes the bottom row', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 0 });
    await grid.freezeBottomRowUnderLinedUpRow(20, 2);

    // No scroll and no other draw follows the settings update, so this is what that one draw left: the
    // bottom clone's height is read after the clone rendered, not from the draw before it existed.
    expect(await grid.masterRowEndsAtLine()).toBe(true);
    expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
    expect(await grid.bottomEdgeAcrossLine(20, 2)).toEqual({
      onLine: expect.stringMatching(/^ht_clone_bottom\/div\.wtBorder current/),
      inside: expect.stringMatching(/^(ht_master|ht_clone_bottom)\/div\.wtBorder current/),
      handleOnTop: true,
      handleAboveBand: true,
    });
  });

  test('fills down from the handle of a lined-up row with a real drag', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1 });

    const row = await grid.arrowToBandEdge(1, 2);
    const scrollTop = await grid.scrollTop();

    expect(await grid.masterRowEndsAtLine()).toBe(true);

    // Half of the handle used to sit under the bottom rows. The drag ends on the first frozen bottom row.
    await grid.dragFillHandleOntoBottomRow(2);

    const value = `R${row + 1}C3`;

    expect((await grid.columnValues(2)).slice(row)).toEqual(Array.from({ length: ROWS - row }, () => value));
    expect(await grid.scrollTop()).toBe(scrollTop);
  });

  test('ends a row the down arrow scrolls to one pixel above the viewport edge without bottom rows', async () => {
    // Without frozen bottom rows the scroll target keeps its extra pixel in every grid shape.
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 0 });

    const row = await grid.arrowToBandEdge(1, 2);

    expect(row).toBeLessThan(ROWS - 1);
    expect(await grid.cellBottomInsetFromViewport(row, 2)).toBe(1);
  });
});

test.describe('fixedRowsBottom freeze line in other grid shapes', { tag: ['@core', THEMES_TAG] }, () => {
  let grid: FixedRowsBottomLinePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedRowsBottomLinePage(page, theme, bundle);
  });

  test('is one border high under a lined-up row in a grid without column headers', async () => {
    // Without a column header the first body row draws the top gridline, a pixel the summed row heights
    // leave out, and the scroll target keeps its extra pixel for it.
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, colHeaders: false });

    const row = await grid.arrowToBandEdge(1, 2);

    expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
    expect(await grid.masterRowEndsAtLine()).toBe(true);
    expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
  });

  test('is one border high under a lined-up row with AutoRowSize and no column headers', async () => {
    // AutoRowSize counts the first row's top border in that row's height, so the scroll target has no pixel
    // to add although no column header owns the gridline.
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, colHeaders: false, autoRowSize: true });

    const row = await grid.arrowToBandEdge(1, 2);

    expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
    expect(await grid.masterRowEndsAtLine()).toBe(true);
    expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
  });

  test('draws the selection edge on the line and keeps a custom border in view with AutoRowSize', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, autoRowSize: true });

    const row = await grid.arrowToBandEdge(1, 2);

    expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
    expect(await grid.masterRowEndsAtLine()).toBe(true);
    expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 2)).toEqual({
      onLine: expect.stringMatching(/^ht_clone_bottom\/div\.wtBorder current/),
      inside: expect.stringMatching(/^(ht_master|ht_clone_bottom)\/div\.wtBorder current/),
      handleOnTop: true,
      handleAboveBand: true,
    });

    await grid.addCustomBottomBorder(row, 2);

    expect(await grid.masterRowEndsAtLine()).toBe(true);
    await expect.poll(() => grid.customBottomBorderAgainstBand()).toEqual({ height: 1, underBand: 0 });
  });

  test('leaves a row above a bottom row with a height of its own drawn as any other row', async () => {
    // A frozen bottom row with a height of its own holds its top border inside that height, so the bottom
    // clone does not cover the border of the row that ends on it. The selection and a custom border of that
    // row are then drawn on the row's own gridline, and the bottom clone draws no part of the selection.
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, minRowHeights: 40 });

    const row = await grid.arrowToBandEdge(1, 2);

    expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
    expect(await grid.masterRowEndsAtLine()).toBe(true);
    // Only the line's own pixel is read: a hit test half a pixel above a collapsed border answers either table.
    await expect.poll(() => grid.bottomEdgeAcrossLine(row, 2)).toMatchObject({
      onLine: expect.stringMatching(/^ht_clone_bottom\/td/),
    });

    await grid.addCustomBottomBorder(row, 2);

    await expect.poll(() => grid.customBottomBorderOffGridline(row, 2)).toBe(0);
  });
});

test.describe('fixedRowsBottom freeze line after AutoRowSize is switched at runtime', { tag: ['@core', THEMES_TAG] }, () => {
  let grid: FixedRowsBottomLinePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedRowsBottomLinePage(page, theme, bundle);
  });

  test('is one border high under a lined-up row after updateSettings() turned AutoRowSize on', async () => {
    // The engine used to keep measuring the rows next to the plugin. It recorded the bottom clone's first row
    // with its top border, the freeze line, so the row calculators counted the line and a lined-up row ended
    // above it, with both borders showing.
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1 });
    await grid.setAutoRowSize(true);
    await grid.scrollRowToBandEdge(20);

    expect(await grid.masterRowEndsAtLine()).toBe(true);
    expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
  });

  test('counts a row that grows into the scroll range after updateSettings() turned AutoRowSize off', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, autoRowSize: true });
    await grid.setAutoRowSize(false);

    const rangeBefore = (await grid.rowGrowthAndScrollRange(2, 1)).scrollRange;

    // Nobody measured the rows any more: the engine still left it to the plugin, so the row that grew was
    // drawn taller while the scroll range kept its height.
    await grid.fillWithWrappingText(2, 1);

    // The row's growth and the scroll range are read together: the range grew by exactly what the row gained.
    await expect.poll(async () => {
      const { rowGrowth, scrollRange } = await grid.rowGrowthAndScrollRange(2, 1);

      return { rowGrew: rowGrowth > 10, rangeShortBy: rowGrowth - (scrollRange - rangeBefore) };
    }).toEqual({ rowGrew: true, rangeShortBy: 0 });
  });
});
