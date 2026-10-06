import { test, expect } from '../fixtures/test';
import { FixedColumnsEndPage } from '../fixtures/pages/FixedColumnsEndPage';

/**
 * DragToScroll next to the row headers. The row headers stand on the inline-start side (the left in LTR, the
 * right in RTL), so the auto-scroll boundary that makes room for them is on that side. A pointer over the row
 * header strip scrolls the grid towards the inline start, and a pointer near the opposite edge, which in RTL is
 * where the frozen end columns stand, does not scroll it early.
 *
 * Grid of the fixture: 30 columns, 72 px wide, 500 x 300 px viewport, row headers, no frozen end columns.
 */
const SCROLL_START = 400;
const INSET = 20;
const IDLE_FRAMES = 60;

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';
  const rowHeaderSide = rtl ? 'right' : 'left';
  const oppositeSide = rtl ? 'left' : 'right';

  test.describe(`DragToScroll with row headers (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndPage(page, theme, bundle);
      await grid.goto({ rtl, fixedColumnsEnd: 0 });
      await grid.scrollTo({ left: SCROLL_START });
      await expect.poll(() => grid.scrollLeft()).toBe(SCROLL_START);
    });

    test.afterEach(async () => {
      await grid.releaseMouse();
    });

    test('scrolls towards the inline start when the pointer is over the row header strip', async () => {
      await grid.pressGridCenter();
      await grid.movePointerInsideEdge(rowHeaderSide, INSET);

      // The auto-scroll is timer-driven: it keeps scrolling while the pointer rests there.
      await expect.poll(() => grid.scrollLeft()).toBeLessThan(SCROLL_START);
    });

    test('does not scroll when the pointer is near the opposite edge, inside the grid', async () => {
      // The control of this case is the one above: the same drag does scroll from the row header strip.
      await grid.pressGridCenter();
      await grid.movePointerInsideEdge(oppositeSide, INSET);

      // Extending the selection onto a partly visible column scrolls it into view once, so the first frames may
      // move. What must not happen is progress while the pointer rests: the auto-scroll timer would keep going.
      const samples = await grid.scrollLeftOverFrames(IDLE_FRAMES);
      const resting = samples.slice(IDLE_FRAMES / 2);

      expect(resting).toEqual(Array(resting.length).fill(samples[IDLE_FRAMES / 2 - 1]));
    });
  });
}
