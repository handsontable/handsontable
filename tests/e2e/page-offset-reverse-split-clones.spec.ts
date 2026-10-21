import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { PageOffsetReverseSplitPage, type PageOffsetLayout } from '../fixtures/pages/PageOffsetReverseSplitPage';

// Classic scrollbars (they take layout space), so a clone that forgets the holder's horizontal scrollbar
// is measurably taller than its twin. Overlay scrollbars would hide the difference.
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
    args: ['--disable-features=OverlayScrollbar'],
  },
});

/**
 * In the reverse split (an ancestor that clips only the vertical axis, or `preventOverflow: 'vertical'`) the
 * window owns the horizontal axis on paper, yet the holder scrolls the columns. Everything that sizes the
 * clones, the page's scroll range and the pointer bounds must then follow the holder, exactly as in the same
 * grid inside an ancestor clipping both axes (`overflow-y: hidden`), the twin of every case here.
 */
const MARGIN = 200;
// Column offset from the page edge and the row the pointer moves to: first over the row header, then inside the gap.
const DRAG_POINTS: [number, number][] = [[210, 3], [100, 4], [100, 5]];

const reverseSplits: { name: string, layout: PageOffsetLayout }[] = [
  { name: '`overflow-y: clip` ancestor', layout: { overflowY: 'clip' } },
  { name: '`preventOverflow: vertical`', layout: { overflowY: 'visible', preventOverflow: 'vertical' } },
];

test.describe('clones, page scroll range and pointer bounds in the reverse split', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let grid: PageOffsetReverseSplitPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PageOffsetReverseSplitPage(page, theme, bundle);
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    for (const fixedColumnsStart of [0, 2]) {
      for (const { name, layout } of reverseSplits) {
        test(`sizes the clones and the page like the hidden twin: ${name}, ${dir}, ${fixedColumnsStart} frozen columns`, async() => {
          await grid.goto({ ...layout, dir, fixedColumnsStart, fixedRowsBottom: 2, margin: MARGIN });
          const offset = await grid.cloneGeometry();

          // The holder, not the page, scrolls the columns: no horizontal scroll range on the page, headers as
          // wide as the holder, and the clones follow the holder's vertical scroll position.
          expect(offset.documentScrollWidth).toBe(offset.documentClientWidth);
          // The column header is as wide as the holder's scrollport, which is narrower than the page by the offset.
          expect(offset.topCloneWidth).toBe(offset.holderClientWidth);
          expect(offset.holderClientWidth).toBeLessThan(offset.documentClientWidth - MARGIN + 1);
          expect(offset.bottomCloneWidth).toBe(offset.topCloneWidth);
          expect(offset.inlineStartCloneScrollTop).toBe(offset.holderScrollTop);
          expect(offset.markedAsWindowScrolled).toBe(false);

          // `preventOverflow: vertical` has no hidden twin: the window keeps the rows, so only the absolute values
          // above describe it. An `overflow-y: clip` ancestor is compared with the same grid in a hidden one.
          // The frozen clones sit at the holder's inline-start edge, whatever the scroll position.
          const edge = (box: number[] | null | undefined) => (box ? (dir === 'rtl' ? box[0] + box[2] : box[0]) : NaN);
          const holderEdge = edge(offset.holderBox);

          expect(edge(offset.inlineStartClone)).toBe(holderEdge);
          expect(edge(offset.topCorner)).toBe(holderEdge);
          expect(offset.topCorner?.[2]).toBe(offset.inlineStartClone?.[2]);
          expect(edge(offset.bottomCorner)).toBe(holderEdge);

          if (!layout.preventOverflow) {
            await grid.goto({ ...layout, overflowY: 'hidden', dir, fixedColumnsStart, fixedRowsBottom: 2, margin: MARGIN });
            expect(offset).toEqual(await grid.cloneGeometry());
          }
        });
      }
    }
  }

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`tracks a drag that moves inside the page offset gap like the hidden twin (${dir})`, async() => {
      await grid.goto({ overflowY: 'clip', margin: MARGIN, dir });
      const offset = await grid.dragThroughGap(DRAG_POINTS);

      await grid.goto({ overflowY: 'hidden', margin: MARGIN, dir });
      const twin = await grid.dragThroughGap(DRAG_POINTS);

      expect(twin).toEqual(['3,0', '4,0', '5,0']);
      expect(offset).toEqual(twin);
    });
  }

  test('draws the same rows and columns as the hidden twin while the holder scrolls through bands', async() => {
    // The reverse split takes the single-pass layout and row recycling paths of an element-scrolled grid.
    await grid.goto({ overflowY: 'clip', margin: MARGIN, fixedColumnsStart: 2, fixedRowsBottom: 2 });
    const offset = await grid.scrollThroughBands();

    await grid.goto({ overflowY: 'hidden', margin: MARGIN, fixedColumnsStart: 2, fixedRowsBottom: 2 });
    const twin = await grid.scrollThroughBands();

    expect(offset.every(read => read.endsWith('/true'))).toBe(true);
    expect(offset).toEqual(twin);
  });

  test('tracks a drag that moves inside the page offset gap with `preventOverflow: vertical`', async() => {
    // No hidden twin (the window keeps the rows), so the expected cells are the ones under the pointer.
    await grid.goto({ overflowY: 'visible', preventOverflow: 'vertical', margin: MARGIN });

    expect(await grid.dragThroughGap(DRAG_POINTS)).toEqual(['3,0', '4,0', '5,0']);
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`opens the editor of a frozen cell over that cell after a sideways scroll, like the hidden twin (${dir})`, async() => {
      await grid.goto({ overflowY: 'clip', margin: MARGIN, fixedColumnsStart: 2, dir });
      const offset = await grid.editorShift();

      await grid.goto({ overflowY: 'hidden', margin: MARGIN, fixedColumnsStart: 2, dir });
      const twin = await grid.editorShift();

      expect(Math.abs(twin)).toBeLessThanOrEqual(2);
      expect(offset).toBe(twin);
    });
  }

  // Control: the window scrolls both axes here, so none of the reverse-split branches run. These pin the layout
  // the change must leave alone, and they pass with and without it.
  test('control: a page the window scrolls on both axes keeps its page-wide clones and scroll range', async() => {
    await grid.goto({ overflowY: 'visible', margin: MARGIN });
    const geometry = await grid.cloneGeometry();

    // 100 columns of 100px, the row header (50px) and the offset: the page itself scrolls that far.
    expect(geometry.topCloneWidth).toBeGreaterThan(10000);
    expect(geometry.documentScrollWidth).toBeGreaterThan(10000);
    expect(geometry.documentScrollWidth).toBeGreaterThan(geometry.documentClientWidth);
  });
});
