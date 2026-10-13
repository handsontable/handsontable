import { test, expect } from '../../fixtures/test';
import { InlineEndReview2Page } from '../../fixtures/pages/walkontable/InlineEndReview2Page';

/**
 * Second round of review cases for the `fixedColumnsEnd` overlays: the end clones in a grid the holder scrolls
 * while the window owns the other axis (`preventOverflow: 'vertical'`), the `aria-colindex` of a column header
 * against the one of its cells, the fill handle on the grid's last column, and the header height with frozen
 * columns on both sides.
 */
const TOLERANCE = 1;

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';

  test.describe(`walkontable inline-end overlay, review round 2 (${direction})`, { tag: '@walkontable' }, () => {
    let wt: InlineEndReview2Page;

    test.beforeEach(async ({ page, theme, bundle }) => {
      wt = new InlineEndReview2Page(page, theme, bundle);
    });

    test('holds the end clone and its corners at the grid edge, not the page edge, when the holder scrolls the columns',
      async () => {
        await wt.goto({ rtl, windowScroll: true, fixedColumnsEnd: 2, fixedRowsTop: 1, fixedRowsBottom: 1 });
        // A grid a third as wide as the page: its holder scrolls the columns, the window keeps the rows.
        await wt.narrowTheGridAndPreventVerticalOverflow(400, 300);

        const holder = await wt.holderClientBox();
        const edgeOf = (box: { left: number, right: number }) => (rtl ? box.left : box.right);
        const expectedEdge = edgeOf(holder);
        const names = ['inline_end', 'top_inline_end_corner', 'bottom_inline_end_corner'] as const;

        // The page is far wider than the grid, so a clone pinned to the viewport would miss the grid's edge by
        // hundreds of pixels.
        expect(Math.abs(edgeOf(await wt.gridBox()) - expectedEdge)).toBeLessThanOrEqual(TOLERANCE);

        for (const name of names) {
          const extent = await wt.horizontalExtent(name);

          expect(Math.abs(edgeOf(extent) - expectedEdge), `${name} at rest`).toBeLessThanOrEqual(TOLERANCE);
        }

        // The bottom corner rests on the bottom overlay's edge, not at the top of the grid.
        expect(Math.abs((await wt.boxOf('bottom_inline_end_corner')).bottom - (await wt.boxOf('bottom')).bottom))
          .toBeLessThanOrEqual(TOLERANCE);

        await wt.scrollTo({ left: 200, top: 0 });
        await expect.poll(() => wt.holder().evaluate(element => Math.abs(element.scrollLeft))).toBe(200);
        await wt.settleFrames();

        for (const name of names) {
          const extent = await wt.horizontalExtent(name);

          expect(Math.abs(edgeOf(extent) - expectedEdge), `${name} after the holder scrolled`)
            .toBeLessThanOrEqual(TOLERANCE);
        }
      });

    test('gives every header of a column the aria-colindex its body cells carry, in every table', async () => {
      for (const fixedColumnsEnd of [0, 2]) {
        await wt.goto({ rtl, fixedColumnsStart: 1, fixedColumnsEnd, fixedRowsTop: 1, fixedRowsBottom: 1 });
        // Scrolled to the end: the master and the top clone render the last columns, far from their own first one.
        await wt.scrollTo({ left: await wt.maxScrollLeft(), top: 0 });
        await expect(wt.cellIn(wt.master, 0, 29)).toBeAttached();
        await wt.settleFrames();

        const { headers, cells } = await wt.ariaColumnIndexes();
        // One row header column comes first, and the attribute is 1-based.
        const expectedIndex = (col: number) => col + 2;

        expect(headers.some(header => header.table === 'ht_clone_top' && header.col === 29), 'top clone header')
          .toBe(true);

        if (fixedColumnsEnd) {
          expect(headers.some(header => header.table === 'ht_clone_top_inline_end_corner' && header.col === 29),
            'end corner header').toBe(true);
        }

        for (const header of headers) {
          expect(header.ariaColIndex, `${header.table} header of column ${header.col} (end columns ${fixedColumnsEnd})`)
            .toBe(expectedIndex(header.col));
        }

        for (const cell of cells) {
          expect(cell.ariaColIndex, `${cell.table} cell of column ${cell.col} (end columns ${fixedColumnsEnd})`)
            .toBe(expectedIndex(cell.col));
        }
      }
    });

    for (const windowScroll of [false, true]) {
      for (const fixedColumnsEnd of [1, 3]) {
        test(`keeps the fill handle on the last column inside the end clone (${windowScroll ? 'window' : 'holder'} scroll, ` +
          `${fixedColumnsEnd} end columns)`, async () => {
          await wt.goto({ rtl, windowScroll, fixedColumnsEnd });
          await wt.selectRange(3, 29, 3, 29);

          if (windowScroll) {
            await wt.scrollWindowTo(await wt.maxWindowScroll());
          } else {
            await wt.scrollTo({ left: await wt.maxScrollLeft(), top: 0 });
          }

          await expect.poll(() => wt.endCloneFillHandle()).not.toBeNull();

          const found = (await wt.endCloneFillHandle())!;

          // The end holder clips at its own edge: a handle that straddles the last column loses half of itself.
          expect(found.handle.left).toBeGreaterThanOrEqual(found.holder.left - 0.5);
          expect(found.handle.right).toBeLessThanOrEqual(found.holder.right + 0.5);
        });
      }
    }

    test('keeps one header row height across all tables with frozen columns on both sides, without inflating it',
      async () => {
        await wt.goto({ rtl, fixedColumnsStart: 1, fixedColumnsEnd: 1 });
        // The start column's header wraps further than the end column's, so the two corners disagree.
        await wt.setWrappingColumnHeaders({ 0: 30, 29: 15 });

        const heights = await wt.headerRowHeights();
        const tableCount = Object.keys(heights).length;
        const [tallest] = Object.values(heights);

        expect(tableCount).toBeGreaterThanOrEqual(6);
        expect(tallest).toBeGreaterThan(60);
        expect(new Set(Object.values(heights)), JSON.stringify(heights)).toEqual(new Set([tallest]));

        for (let render = 0; render < 3; render++) {
          await wt.renderAgain();
          expect(await wt.headerRowHeights(), `render ${render + 1}`).toEqual(heights);
        }

        // The same headers beside a single frozen side give the height both corners must not exceed.
        await wt.goto({ rtl, fixedColumnsStart: 1, fixedColumnsEnd: 0 });
        await wt.setWrappingColumnHeaders({ 0: 30, 29: 15 });
        expect(Object.values(await wt.headerRowHeights())[0]).toBe(tallest);
      });
  });
}
