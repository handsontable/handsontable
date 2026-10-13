import { test, expect } from '../../fixtures/test';
import { InlineEndReviewPage } from '../../fixtures/pages/walkontable/InlineEndReviewPage';

/**
 * Review cases for the `fixedColumnsEnd` overlays that the base spec (`inline-end-overlay.spec.ts`) does not
 * pin: which physical side each clone is anchored to, the selection edge at the first end column, the
 * a column wider than the room the end band
 * leaves, and the overlay offset of a window-scrolled RTL page with a margin.
 */
const TOLERANCE = 1;

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';

  test.describe(`walkontable inline-end overlay, review (${direction})`, { tag: '@walkontable' }, () => {
    let wt: InlineEndReviewPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      wt = new InlineEndReviewPage(page, theme, bundle);
    });

    test('anchors each clone to its own physical side, whether or not the end band is rendering', async () => {
      // Idle: the end clones keep the side they were made with.
      await wt.goto({ rtl, fixedColumnsStart: 1, fixedColumnsEnd: 0, fixedRowsTop: 1, fixedRowsBottom: 1 });

      const start = rtl ? 'right' : 'left';
      const end = rtl ? 'left' : 'right';
      const other = (side: string) => (side === 'left' ? 'right' : 'left');

      // The start clone stands on the inline-start edge: LEFT in LTR, RIGHT in RTL.
      expect((await wt.insetSides(wt.clone('inline_start')))[start]).toBe('0px');
      expect((await wt.insetSides(wt.clone('inline_start')))[other(start) as 'left' | 'right']).toBe('');

      // The end clones, made before they have anything to draw, stand on the opposite edge.
      for (const name of ['inline_end', 'top_inline_end_corner', 'bottom_inline_end_corner'] as const) {
        const sides = await wt.insetSides(wt.clone(name));

        expect(sides[end], `${name} idle ${end}`).toBe('0px');
        expect(sides[start], `${name} idle ${start}`).toBe('');
      }

      // Rendering: the same clones are inset from that same physical edge, never from the start one.
      await wt.updateSettings({ fixedColumnsEnd: 2 });
      await expect(wt.endOverlay.locator('tbody tr').first().locator('td')).toHaveCount(2);

      const endInset = (await wt.insetSides(wt.clone('inline_end')))[end];

      for (const name of ['inline_end', 'top_inline_end_corner', 'bottom_inline_end_corner'] as const) {
        const sides = await wt.insetSides(wt.clone(name));

        expect(sides[end], `${name} active ${end}`).toMatch(/^\d+(\.\d+)?px$/);
        expect(sides[start], `${name} active ${start}`).toBe('');
        // The corners are drawn over the end overlay's edge, so they take its inset, not their own.
        expect(sides[end], `${name} shares the end overlay inset`).toBe(endInset);
      }
    });

    test('draws the start edge of a selection at the first end column once, not once per overlay', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2 });

      // Starts on the first end column: the end overlay draws the edge, the master and the top/bottom overlays
      // render that column too (under the end overlay) and must not add a copy beside it.
      await wt.selectRange(5, 28, 7, 29);
      await wt.scrollTo({ left: await wt.maxScrollLeft(), top: 0 });
      await expect(wt.cellIn(wt.master, 5, 27)).toBeAttached();
      await expect.poll(() => wt.holder().evaluate(holder => Math.abs(holder.scrollLeft))).toBeGreaterThan(0);

      const rows = await wt.verticalSpan(wt.cellIn(wt.endOverlay, 6, 28));

      await expect.poll(async () => (await wt.visibleStartEdgesAtSeam(rows)).length).toBe(1);
      expect(await wt.visibleStartEdgesAtSeam(rows)).toEqual([expect.stringContaining('ht_clone_inline_end')]);
    });

    test('lets a column wider than the room the end band leaves start at the inline-start edge', async () => {
      await wt.goto({ rtl, fixedColumnsEnd: 2 });
      // Column 12 is 400px wide: it fits the 500px grid, but not the room left beside a 120px end band.
      await wt.widenColumn(12, 400);
      await wt.scrollViewportToColumn(0, 12);

      const cell = wt.cellIn(wt.master, 0, 12);

      await expect(cell).toBeVisible();
      await expect.poll(async () => {
        const holder = await wt.holderClientBox();
        const box = await wt.box(cell);

        // Its inline-start edge is not cut off by the holder: end-aligning it would push that edge out.
        return rtl ? holder.right - box.right : box.left - holder.left;
      }).toBeGreaterThanOrEqual(-TOLERANCE);
    });
  });
}

test.describe('walkontable inline-end overlay, review (window scroll with a margin)', { tag: '@walkontable' }, () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    const rtl = direction === 'rtl';

    test(`reports how far the pinned clone is from the table's end, as the DOM shows it (${direction})`,
      async ({ page, theme, bundle }) => {
        const wt = new InlineEndReviewPage(page, theme, bundle);

        await wt.goto({ rtl, windowScroll: true, fixedColumnsEnd: 2 });
        // The grid does not touch the edges of the page: 30px on the inline-start side, 80px on the end side.
        await wt.insetPage(30, 80);

        const max = await wt.maxWindowScroll();

        expect(max).toBeGreaterThan(300);

        for (const scroll of [0, 100, 300, max - 100, max - 40, max - 10, max]) {
          await wt.scrollWindowTo(scroll);

          const displacement = await wt.endCloneDisplacement();

          await expect.poll(() => wt.endOverlayOffset(), `window scrolled ${scroll}px`).toBe(displacement);
        }
      });
  }
});
