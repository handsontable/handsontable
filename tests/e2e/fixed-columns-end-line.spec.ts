import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FixedColumnsEndLinePage, type FreezeLineSite } from '../fixtures/pages/FixedColumnsEndLinePage';

/**
 * The freeze line at the inline-start edge of the end clones is one border wide in EVERY scroll state:
 * the clone's own first-cell border draws it while the clone's edge cuts through a master column, and the
 * master's border draws it (the clone adds none) at the junction, where the clone rests against the last
 * scrolling column. Measured as computed border widths and box geometry on every theme leg: the shared state
 * (maximum scroll, no scroll) and the switch between the two states in LTR and RTL, the other states in LTR.
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

    test('is one border wide at the maximum scroll, drawn by the last scrolling column', async () => {
      await open();
      await grid.scrollTo(await grid.maxScroll(), COLS - 1, rtl);

      for (const site of SITE_LIST) {
        expect(await grid.endLine(site), site).toEqual({ own: 0, neighbour: 1, total: 1 });
      }
    });

    test('is one border wide without a horizontal scroll, where the clone rests against the last column', async () => {
      await grid.open({
        rtl, cols: 8, rows: ROWS, colWidth: COL_WIDTH, width: 800, fixedColumnsEnd: 2, fixedRowsBottom: 1,
      });
      await grid.scrollTo(0, 5, rtl);

      for (const site of SITE_LIST) {
        expect(await grid.endLine(site), site).toEqual({ own: 0, neighbour: 1, total: 1 });
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

    test('toggles the state class on all three end clones together and leaves it again', async () => {
      await open();
      await grid.scrollTo(await grid.maxScroll(), COLS - 1, rtl);
      expect(await grid.sharedStateOfClones()).toEqual({
        ht_clone_inline_end: true,
        ht_clone_top_inline_end_corner: true,
        ht_clone_bottom_inline_end_corner: true,
      });

      await grid.scrollTo(0, 3, rtl);
      expect(await grid.sharedStateOfClones()).toEqual({
        ht_clone_inline_end: false,
        ht_clone_top_inline_end_corner: false,
        ht_clone_bottom_inline_end_corner: false,
      });
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
