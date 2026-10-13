import { test, expect } from '../fixtures/test';
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
const DRAG_POINTS: [number, number][] = [[210, 135], [100, 193], [100, 251]];

const reverseSplits: { name: string, layout: PageOffsetLayout }[] = [
  { name: '`overflow-y: clip` ancestor', layout: { overflowY: 'clip' } },
  { name: '`preventOverflow: vertical`', layout: { overflowY: 'visible', preventOverflow: 'vertical' } },
];

test.describe('clones, page scroll range and pointer bounds in the reverse split', () => {
  let grid: PageOffsetReverseSplitPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PageOffsetReverseSplitPage(page, theme, bundle);
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    for (const fixedColumnsStart of [0, 2]) {
      for (const { name, layout } of reverseSplits) {
        test(`sizes the clones and the page like the hidden twin: ${name}, ${dir}, ${fixedColumnsStart} frozen columns`, async() => {
          // `preventOverflow: vertical` lets the window scroll the rows, so its twin keeps that axis on the window.
          const twinOverflowY = layout.preventOverflow ? 'visible' : 'hidden';

          await grid.goto({ ...layout, dir, fixedColumnsStart, fixedRowsBottom: 2, margin: MARGIN });
          const offset = await grid.cloneGeometry();

          await grid.goto({
            ...layout, overflowY: twinOverflowY, preventOverflow: layout.preventOverflow, dir, fixedColumnsStart,
            fixedRowsBottom: 2, margin: MARGIN,
          });
          const twin = await grid.cloneGeometry();

          // The twin of `preventOverflow: vertical` still has a window that owns the horizontal axis, so the
          // absolute values pin it down instead: no horizontal scroll range, headers as wide as the holder.
          expect(offset.documentScrollWidth).toBe(offset.documentClientWidth);
          expect(offset.topCloneWidth).toBeLessThan(offset.documentClientWidth - MARGIN + 1);
          expect(offset.bottomCloneWidth).toBe(offset.topCloneWidth);
          expect(offset.inlineStartCloneScrollTop).toBe(offset.holderScrollTop);

          if (!layout.preventOverflow) {
            expect(offset).toEqual(twin);
          } else {
            expect(offset.documentScrollWidth).toBe(twin.documentScrollWidth);
            expect(offset.topCloneWidth).toBe(twin.topCloneWidth);
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

      expect(twin).toEqual(['3,0', '5,0', '7,0']);
      expect(offset).toEqual(twin);
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
