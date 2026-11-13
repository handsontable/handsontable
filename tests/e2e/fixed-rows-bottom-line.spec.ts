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

      // No frozen overlay draws a custom border, so its edge stays off the pixel the bottom clone covers.
      await expect.poll(() => grid.customBottomBorderAgainstBand()).toEqual({ height: 1, underBand: 0 });
    });
  });
}
