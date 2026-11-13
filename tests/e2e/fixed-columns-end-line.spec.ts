import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FixedColumnsEndLinePage, type FreezeLineSite } from '../fixtures/pages/FixedColumnsEndLinePage';

/**
 * The freeze line at the inline-start edge of the end clones is one border wide and on the same pixel in EVERY
 * scroll state: the clone's own first-cell border draws it, and the clone's first column reaches 1px over the
 * column before the band, so the border of a scrolling column that ends at the band's edge lies under it.
 * Measured as computed border widths and box geometry on every theme leg, in LTR and RTL. Only when the band
 * covers every column does the row header draw the line instead.
 */
const COLS = 30;
const COL_WIDTH = 72;
const END = 3;
const ROWS = 20;
const SITE_LIST: FreezeLineSite[] = ['body', 'header', 'bottom'];

for (const rtl of [false, true]) {
  const direction = rtl ? 'RTL' : 'LTR';

  test.describe(`fixedColumnsEnd freeze line in every scroll state (${direction})`, { tag: ['@core', THEMES_TAG] }, () => {
    let grid: FixedColumnsEndLinePage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndLinePage(page, theme, bundle);
    });

    const open = (extra: Record<string, unknown> = {}) => grid.open({
      rtl, cols: COLS, rows: ROWS, colWidth: COL_WIDTH, width: 500, fixedColumnsEnd: END, fixedRowsBottom: 1, ...extra,
    });

    // LTR only: the not-shared state in RTL is the second half of the toggle test below.
    if (!rtl) {
      test('is one border wide at horizontal scroll 0, where the clone cuts through a column', async () => {
        await open();
        await grid.scrollTo(0, 3, rtl);

        for (const site of SITE_LIST) {
          expect(await grid.endLine(site), site).toEqual({ own: 1, neighbour: 0, total: 1 });
        }
      });
    }

    test('is one border wide at the maximum scroll, drawn by the clone over the last scrolling column', async () => {
      await open();
      await grid.scrollTo(await grid.maxScroll(), COLS - 1, rtl);

      for (const site of SITE_LIST) {
        expect(await grid.endLine(site), site).toEqual({ own: 1, neighbour: 0, total: 1 });
      }
    });

    test('is one border wide where a scrolling column ends exactly on the band edge mid-scroll', async () => {
      await open();
      await grid.scrollColumnToBandEdge(12);

      // Precondition: a master column really ends at the line, so two borders could meet there.
      expect(await grid.masterColumnEndsAtLine()).toBe(true);

      for (const site of SITE_LIST) {
        expect(await grid.endLine(site), site).toEqual({ own: 1, neighbour: 0, total: 1 });
      }
    });

    test('keeps the line on the same pixel and the first end column at its width in every scroll state', async () => {
      await open();
      await grid.scrollTo(0, 3, rtl);

      const atStart = await grid.endLineGeometry('body');

      // Every column is COL_WIDTH wide: the first end cell has as much room as the one after it.
      expect(atStart.first).toBe(atStart.second);

      await grid.scrollTo(Math.round((await grid.maxScroll()) / 2), 15, rtl);
      expect(await grid.endLineGeometry('body')).toEqual(atStart);

      await grid.scrollTo(await grid.maxScroll(), COLS - 1, rtl);
      expect(await grid.endLineGeometry('body')).toEqual(atStart);

      for (const site of ['header', 'bottom'] as const) {
        const geometry = await grid.endLineGeometry(site);

        expect(geometry.fromGridEnd, site).toBe(atStart.fromGridEnd);
        expect(geometry.first, site).toBe(geometry.second);
      }
    });

    test('keeps the editor of the last scrolling column clear of the freeze line at the maximum scroll', async () => {
      await open();
      await grid.scrollTo(await grid.maxScroll(), COLS - 1, rtl);
      await grid.openEditor(1, COLS - END - 1);

      // The editor's end border ends right before the line, so the end clone paints none of it.
      expect(await grid.editorGapToLine()).toBe(0);
    });

    test('draws the selection edge on the line for a column the arrow key lines up with the band', async () => {
      await open();

      const column = await grid.arrowToBandEdge(1, 1, rtl);

      // Precondition: the arrow key scrolled the grid, and the selected column ends at the line.
      expect(column).toBeGreaterThan(1);
      expect(await grid.masterColumnEndsAtLine()).toBe(true);

      // Like at any gridline: the line pixel is the selection's (drawn by the end clone over itself), and so is
      // the pixel inside it (the master's edge, or the clone's copy where its holder does not clip it). The fill
      // handle stays uncovered.
      await expect.poll(() => grid.endEdgeAcrossLine(1, column)).toEqual({
        onLine: expect.stringMatching(/^ht_clone_inline_end\/div\.wtBorder current/),
        inside: expect.stringMatching(/^(ht_master|ht_clone_inline_end)\/div\.wtBorder current/),
        handleOnTop: true,
      });
    });

    test('keeps a custom end border of a column the arrow key lines up with the band in view', async () => {
      await open();

      const column = await grid.arrowToBandEdge(1, 1, rtl);

      await grid.addCustomEndBorder(3, column);
      // Precondition: the column still ends at the line once the border is drawn.
      await expect.poll(() => grid.masterColumnEndsAtLine()).toBe(true);

      // Nothing redraws a custom border over the end clone, so its 1px edge stays off the line, inside its cell,
      // where the user sees it (the border is red).
      await expect.poll(() => grid.customEndBorderAgainstBand()).toEqual({ width: 1, underBand: 0 });
      await expect.poll(() => grid.colorInsideEndEdge(3, column)).toEqual([255, 0, 0]);
    });

    test('drops the edge from the end clone once the column scrolls off the line', async () => {
      await open();
      await grid.arrowToBandEdge(1, 1, rtl);
      // Precondition: lined up, the end clone draws its piece of the edge.
      await expect.poll(() => grid.endCloneShowsCurrentBorder()).toBe(true);

      await grid.scrollFurtherBy(5);

      await expect.poll(() => grid.endCloneShowsCurrentBorder()).toBe(false);
    });

    test('keeps the outline and fill handle of a selected merge that runs from the lined-up column into the band', async () => {
      await open();

      const column = COLS - END - 1;

      await grid.scrollTo(await grid.maxScroll(), COLS - 1, rtl);
      await grid.mergeAndSelect(3, column, 2, 2);
      expect(await grid.masterColumnEndsAtLine()).toBe(true);

      await expect.poll(() => grid.blockOutlineInEndClone(3, column)).toMatchObject({
        handleOnTop: true,
        endEdgeOffset: 0,
        bottomEdgeOffset: 0,
      });

      const { handleOffset } = await grid.blockOutlineInEndClone(3, column);

      expect(Math.max(...handleOffset!.map(Math.abs))).toBeLessThanOrEqual(6);
    });

    test('is one border wide without a horizontal scroll, where the clone rests against the last column', async () => {
      await grid.open({
        rtl, cols: 8, rows: ROWS, colWidth: COL_WIDTH, width: 800, fixedColumnsEnd: 2, fixedRowsBottom: 1,
      });
      await grid.scrollTo(0, 5, rtl);

      for (const site of SITE_LIST) {
        expect(await grid.endLine(site), site).toEqual({ own: 1, neighbour: 0, total: 1 });
      }
    });

    // LTR only: both lines are logical borders, so RTL draws the same widths.
    if (!rtl) {
      test('matches the width of the start freeze line in every scroll state', async () => {
        await open({ fixedColumnsStart: 2 });
        await grid.scrollTo(0, 3, rtl);

        const reference = await grid.startLine(1);

        expect(reference).toBe(1);
        expect((await grid.endLine('body')).total).toBe(reference);

        // The start band narrows the scrolling area, so the half way point renders later columns.
        await grid.scrollTo(Math.round((await grid.maxScroll()) / 2) + 23, 15, rtl);
        expect((await grid.endLine('body')).total).toBe(reference);

        await grid.scrollTo(await grid.maxScroll(), COLS - 1, rtl);
        expect((await grid.endLine('body')).total).toBe(reference);
      });
    }

    test('keeps the state class off on all three end clones in every scroll state', async () => {
      const off = {
        ht_clone_inline_end: false,
        ht_clone_top_inline_end_corner: false,
        ht_clone_bottom_inline_end_corner: false,
      };

      await open();
      await grid.scrollTo(await grid.maxScroll(), COLS - 1, rtl);
      expect(await grid.sharedStateOfClones()).toEqual(off);

      await grid.scrollTo(0, 3, rtl);
      expect(await grid.sharedStateOfClones()).toEqual(off);
    });

    // LTR only: this branch of `isFreezeLineShared()` reads column counts, not positions.
    if (!rtl) {
      test('keeps the grid frame line when the end band covers every column of a grid without row headers', async () => {
        await grid.open({
          rtl, cols: 3, rows: ROWS, colWidth: COL_WIDTH, width: 800, fixedColumnsEnd: 3, rowHeaders: false,
        });
        await grid.scrollTo(0, 0, rtl);

        // Nothing precedes the band: the clone's own border is the grid's outer frame line.
        expect(await grid.endLine('body')).toEqual({ own: 1, neighbour: 0, total: 1 });
        expect((await grid.sharedStateOfClones()).ht_clone_inline_end).toBe(false);
      });
    }

    // LTR only: same branch as the case above.
    if (!rtl) {
      test('leaves the line to the row header when the band covers every column', async () => {
        await grid.open({
          rtl, cols: 3, rows: ROWS, colWidth: COL_WIDTH, width: 800, fixedColumnsEnd: 3,
        });
        await grid.scrollTo(0, 0, rtl);

        // The row header's inline-end border is the line; the clone adds none.
        expect((await grid.sharedStateOfClones()).ht_clone_inline_end).toBe(true);
      });
    }
  });
}
