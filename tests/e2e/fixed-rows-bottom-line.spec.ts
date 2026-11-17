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

  test('ends the row a down arrow lines up with the bottom rows one border under them, with AutoRowSize', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, colHeaders: false, autoRowSize: true });

    const row = await grid.arrowToBandEdge(1, 2);

    expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
    expect(await grid.rowOverlapWithBottomRows(row, 2)).toBe(1);
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

  test('draws the selection edge on the line and keeps a custom border in view with a bottom row height of its own', async () => {
    // A frozen bottom row with a height of its own is drawn one pixel taller than the height counted for it,
    // like a row without one, so the bottom clone covers the border of the row that ends on it and draws the
    // selection's line pixel.
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, minRowHeights: 40 });

    const row = await grid.arrowToBandEdge(1, 2);

    expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
    expect(await grid.masterRowEndsAtLine()).toBe(true);
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
});

/**
 * A first frozen bottom row with a height of its own (`rowHeights`, `minRowHeights`, ManualRowResize, content
 * taller than the default) used to hold the freeze line's border inside that height. The bottom clone was then
 * as tall as the heights counted for it, and a row lined up with the bottom rows ended beside the clone's border
 * with its own, a line two pixels high. The first row of the bottom tables is now drawn one pixel above its
 * height, as the default height is, and that pixel is not counted.
 */
const OWN_HEIGHT_GRIDS = [
  { name: 'rowHeights', options: { rowHeights: 40 }, firstRowHeight: 40 },
  { name: 'minRowHeights', options: { minRowHeights: 40 }, firstRowHeight: 40 },
  { name: 'ManualRowResize', options: { manualRowResizeLast: 50 }, firstRowHeight: 50 },
  { name: 'content taller than the default', options: { wrapLastRow: true }, firstRowHeight: null },
  {
    name: 'AutoRowSize and content taller than the default',
    options: { autoRowSize: true, wrapLastRow: true },
    firstRowHeight: null,
  },
] as const;

for (const rtl of [false, true]) {
  const direction = rtl ? 'RTL' : 'LTR';

  test.describe(
    `fixedRowsBottom freeze line with a first bottom row height of its own (${direction})`,
    { tag: ['@core', THEMES_TAG] },
    () => {
      let grid: FixedRowsBottomLinePage;

      test.beforeEach(({ page, theme, bundle }) => {
        grid = new FixedRowsBottomLinePage(page, theme, bundle);
      });

      for (const { name, options, firstRowHeight } of OWN_HEIGHT_GRIDS) {
        test(`is one border high under a row a bottom snap lines up, with ${name}`, async () => {
          await grid.open({ rtl, rows: ROWS, cols: COLS, fixedRowsBottom: 1, ...options });
          await grid.scrollRowToBandEdge(20);

          // Precondition: a master row really ends at the line, so two borders could meet there.
          expect(await grid.masterRowEndsAtLine()).toBe(true);
          expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });

          const metrics = await grid.bottomCloneMetrics(1);

          // The extra pixel is the line, outside the counted height.
          expect(metrics.clone - metrics.counted).toBe(1);

          if (firstRowHeight !== null) {
            expect(metrics.counted).toBe(firstRowHeight);
          } else {
            // Precondition: the row is taller than the default really, so the case measures content.
            expect(metrics.counted).toBeGreaterThan(40);
          }
        });

        test(`is one border high under a row the down arrow lines up, with ${name}`, async () => {
          await grid.open({ rtl, rows: ROWS, cols: COLS, fixedRowsBottom: 1, ...options });

          const row = await grid.arrowToBandEdge(1, 2);

          expect(row).toBeLessThan(LAST_SCROLLABLE_ROW);
          expect(await grid.masterRowEndsAtLine()).toBe(true);
          expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
        });
      }

      test('draws one extra pixel on the first of two frozen bottom rows only', async () => {
        await grid.open({ rtl, rows: ROWS, cols: COLS, fixedRowsBottom: 2, rowHeights: 40 });
        await grid.scrollRowToBandEdge(20);

        const metrics = await grid.bottomCloneMetrics(2);

        expect(metrics.counted).toBe(80);
        expect(metrics.rows).toEqual([41, 40]);
        expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
      });

      test('draws the first row of the bottom start corner as tall as the bottom clone does', async () => {
        await grid.open({ rtl, rows: ROWS, cols: COLS, fixedRowsBottom: 1, fixedColumnsStart: 2, rowHeights: 40 });
        await grid.scrollRowToBandEdge(20);

        const metrics = await grid.bottomCloneMetrics(1);

        expect(metrics.rows).toEqual([41]);
        expect(metrics.cornerRows).toEqual([41]);
      });
    }
  );
}

test.describe('fixedRowsBottom with a first bottom row height of its own keeps what is counted', { tag: ['@core', THEMES_TAG] }, () => {
  let grid: FixedRowsBottomLinePage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FixedRowsBottomLinePage(page, theme, bundle);
  });

  // The pixel above the row is never recorded: a record that kept it would grow the counted height on every draw.
  // Content taller than the default is the one case the engine measures, so it is read over repeated renders, and
  // with frozen start columns, where the frozen-column row sync measures the bottom start corner as well.
  for (const { name, options } of [
    { name: 'rowHeights', options: { rowHeights: 40 } },
    { name: 'minRowHeights', options: { minRowHeights: 40 } },
    { name: 'content taller than the default', options: { wrapLastRow: true } },
  ] as const) {
    test(`does not grow the counted bottom height over repeated renders, with ${name} and frozen start columns`,
      async () => {
        await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, fixedColumnsStart: 2, ...options });
        await grid.scrollRowToBandEdge(20);

        const first = await grid.bottomCloneMetrics(1);

        await grid.renderAgain(3);

        const later = await grid.bottomCloneMetrics(1);

        expect(later.counted).toBe(first.counted);
        expect(later.clone - later.counted).toBe(1);
        expect(later.rows).toEqual(first.rows);
        expect(later.cornerRows).toEqual(first.rows);

        // A height set by an option is no record of what the row rendered, so the freeze line's pixel cannot be
        // in one. Content the engine measured is recorded at the counted height, which has no such pixel.
        expect(later.recordedLastRow).toBe(name === 'content taller than the default' ? later.counted : null);
      });
  }

  test('draws the first row of the bottom end corner as tall as the bottom clone does', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, fixedColumnsEnd: 2, rowHeights: 40 });
    await grid.scrollRowToBandEdge(20);

    const metrics = await grid.bottomCloneMetrics(1);

    expect(metrics.rows).toEqual([41]);
    expect(metrics.cornerEndRows).toEqual([41]);
  });

  test('leaves the rows of the master as tall as their height', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, rowHeights: 40 });
    await grid.scrollRowToBandEdge(20);

    // The master draws no freeze line of its own at its first rendered row: that row keeps its height.
    expect((await grid.bottomCloneMetrics(1)).masterRows).toEqual([40, 40, 40]);
  });

  test('draws the extra pixel on the first row that is shown when the first bottom row is hidden', async () => {
    // Rows 38 and 39 are frozen. Row 38 is hidden, so row 39 is the first row the bottom clone renders.
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 2, rowHeights: 40, hiddenRow: ROWS - 2 });
    await grid.scrollRowToBandEdge(20);

    const metrics = await grid.bottomCloneMetrics(2);

    expect(metrics.rows).toEqual([41]);
    expect(await grid.bottomLine()).toEqual({ own: 1, neighbour: 0, total: 1 });
  });

  test('draws the first row of the bottom clone one pixel above the height a hook gives it for that overlay', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, bottomOverlayHeight: 45 });

    await expect.poll(async () => (await grid.bottomCloneMetrics(1)).rows).toEqual([46]);
  });

  test('counts the same bottom height whether or not the grid is scrolled to a lined-up row', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1, rowHeights: 40 });

    // The bottom clone renders with the grid, but read it the way every other probe here does: until it settles.
    await expect.poll(async () => (await grid.bottomCloneMetrics(1)).counted).toBe(40);

    const atTop = await grid.bottomCloneMetrics(1);

    await grid.scrollRowToBandEdge(20);

    const lined = await grid.bottomCloneMetrics(1);

    expect(atTop.counted).toBe(40);
    expect(lined.counted).toBe(40);
    expect(atTop.clone).toBe(41);
    expect(lined.clone).toBe(41);
  });

  // A resize drag stores the size it was dragged by. The freeze line's pixel is drawn above the row, so it is not
  // part of the header's size, or every drag of that row would store one pixel more than the pointer moved.
  for (const rtl of [false, true]) {
    for (const delta of [20, -10]) {
      test(`stores the dragged distance when the first bottom row header is dragged by ${delta}px (${rtl ? 'RTL' : 'LTR'})`,
        async () => {
          await grid.open({
            rtl, rows: ROWS, cols: COLS, fixedRowsBottom: 1, fixedColumnsStart: 2, manualRowResizeLast: 50,
          });

          const stored = await grid.dragBottomRowHandle(0, delta);

          expect(stored).toBe(50 + delta);
          await expect.poll(async () => (await grid.bottomCloneMetrics(1)).counted).toBe(50 + delta);
          expect((await grid.bottomCloneMetrics(1)).clone).toBe(51 + delta);
        });
    }
  }

  test('stores the dragged distance when the second of two bottom rows is dragged, which carries no pixel', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 2, fixedColumnsStart: 2, manualRowResizeLast: 50 });

    const stored = await grid.dragBottomRowHandle(1, 20);

    expect(stored).toBe(70);
    // The first row is the default height and carries the line's pixel; the dragged row has none.
    await expect.poll(async () => (await grid.bottomCloneMetrics(2)).rows.at(-1)).toBe(70);
  });

  test('keeps the default height rows as they were', async () => {
    await grid.open({ rows: ROWS, cols: COLS, fixedRowsBottom: 1 });
    await grid.scrollRowToBandEdge(20);

    const metrics = await grid.bottomCloneMetrics(1);

    // The default height already counts one pixel less than the row draws: no second pixel is added.
    expect(metrics.clone - metrics.counted).toBe(1);
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

/**
 * A bottom snap must end the row the same way whatever band the grid was in before it. The row's bottom border
 * lies under the first pixel row of the bottom clone, so the row reaches exactly 1px under it. The rows are
 * far enough apart that the band moves with every snap, and they alternate between a first rendered row
 * above and below the next target.
 */
test.describe('fixedRowsBottom bottom snap with AutoRowSize', { tag: ['@core', THEMES_TAG] }, () => {
  const SNAP_ROWS = [40, 60, 41, 20, 40];
  const ALIGNED = SNAP_ROWS.map(() => 1);
  let grid: FixedRowsBottomLinePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedRowsBottomLinePage(page, theme, bundle);
  });

  test('ends every snapped row one border under the bottom rows when the grid has column headers', async () => {
    await grid.open({ rows: 100, cols: COLS, fixedRowsBottom: 1, autoRowSize: true });

    expect(await grid.snapOverlaps(SNAP_ROWS)).toEqual(ALIGNED);
  });

  test('ends every snapped row one border under the bottom rows without column headers', async () => {
    await grid.open({ rows: 100, cols: COLS, fixedRowsBottom: 1, colHeaders: false, autoRowSize: true });

    expect(await grid.snapOverlaps(SNAP_ROWS)).toEqual(ALIGNED);
  });

  test('ends every snapped row one border under the bottom rows when AutoRowSize is turned on later', async () => {
    await grid.open({ rows: 100, cols: COLS, fixedRowsBottom: 1, colHeaders: false });
    await grid.setAutoRowSize(true);

    expect(await grid.snapOverlaps(SNAP_ROWS)).toEqual(ALIGNED);
  });

  test('ends every snapped row one border under the bottom rows in a grid with frozen start columns', async () => {
    await grid.open({
      rows: 100, cols: COLS, fixedRowsBottom: 1, fixedColumnsStart: 2, colHeaders: false, autoRowSize: true,
    });

    expect(await grid.snapOverlaps(SNAP_ROWS, { column: 3 })).toEqual(ALIGNED);
  });

  test('ends every snapped row one pixel above the viewport edge when there are no bottom rows', async () => {
    // Without frozen bottom rows the scroll target keeps one extra pixel, whichever band the grid came from.
    await grid.open({ rows: 100, cols: COLS, fixedRowsBottom: 0, colHeaders: false, autoRowSize: true });

    expect(await grid.snapViewportInsets(SNAP_ROWS)).toEqual(ALIGNED);
  });

  test('ends every snapped row one border under the bottom rows after the row heights were measured again', async () => {
    await grid.open({ rows: 100, cols: COLS, fixedRowsBottom: 1, colHeaders: false, autoRowSize: true });

    expect(await grid.snapOverlaps(SNAP_ROWS, { invalidateCache: true })).toEqual(ALIGNED);
  });
});
