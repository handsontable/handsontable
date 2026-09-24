import { test, expect } from '../../fixtures/test';
import {
  type HeaderPlacement,
  ScrollbarDragEmptyGridPage,
} from '../../fixtures/pages/walkontable/ScrollbarDragEmptyGridPage';

/**
 * DEV-3083: dragging the scrollbar of a grid with nothing rendered on one axis.
 *
 * During a native scrollbar drag the spreaders switch to `position: sticky`, and
 * `StickyScrollStrategy#syncOffsets` recomputes their insets from the first rendered row and column
 * after every scroll frame. A grid with no rows has no first rendered row, and the method used to
 * skip the update for BOTH axes when either start position was missing. The inset of the scrolled
 * axis then froze at its activation value while the rendered band moved on: the headers drifted
 * away from their columns (out of the viewport, for the user), and the release computed its scroll
 * correction from the stale inset and snapped the grid back towards the start. A grid with no
 * columns dragged vertically, and a window-scrolled grid, take the same path.
 *
 * Both symptoms are asserted: the headers stay on their columns (or rows) at every step of the drag,
 * and the release leaves the scroll where the drag put it. The first step is deliberately not a
 * multiple of the 50px default column width: the frozen inset is off by the activation distance
 * modulo that width, so a first step of 50 or 100 would leave broken code on the right place.
 *
 * The same task also reports a populated grid breaking during a drag. That does not reproduce in
 * Chromium and is a different mechanism; it is tracked as DEV-3091.
 */

/**
 * Asserts every rendered header sits on its column or row, within a pixel.
 *
 * @param {HeaderPlacement[]} placements What the page object measured.
 * @param {string} when Which step of the drag, for the failure message.
 */
function expectOnTrack(placements: HeaderPlacement[], when: string): void {
  expect(placements.length, `rendered headers ${when}`).toBeGreaterThan(0);

  for (const { index, actual, expected } of placements) {
    expect(Math.abs(actual - expected), `header ${index} ${when}`).toBeLessThanOrEqual(1);
  }
}

test.describe('Scrollbar drag on a grid with an empty axis', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    for (const rowHeaders of ['off', 'on'] as const) {
      test(`keeps the column headers on their columns of a grid with no rows (${dir}, rowHeaders ${rowHeaders})`,
        async({ page, theme, bundle }) => {
          const grid = new ScrollbarDragEmptyGridPage(page, theme, bundle);

          await grid.goto({ dir, rowHeaders });
          await grid.pressScrollbar();

          for (const distance of [10, 250, 600]) {
            await grid.dragScrollbarTo('horizontal', distance);

            // The drag strategy must own the spreader, or the ordinary scroll path is what is tested.
            expect(await grid.spreaderPosition(), `spreader position at ${distance}px`).toBe('sticky');
            expectOnTrack(await grid.columnHeaderPlacements(), `at ${distance}px`);
          }

          await grid.releaseScrollbar();

          await expect.poll(() => grid.scrollDistance('horizontal')).toBe(600);
          expect(await grid.spreaderPosition(), 'spreader position after release').toBe('relative');
          expectOnTrack(await grid.columnHeaderPlacements(), 'after release');
        });
    }
  }

  test('keeps the row headers on their rows of a grid with no columns', async({ page, theme, bundle }) => {
    const grid = new ScrollbarDragEmptyGridPage(page, theme, bundle);

    await grid.goto({ shape: 'no-columns' });
    await grid.pressScrollbar();

    for (const distance of [10, 250, 600]) {
      await grid.dragScrollbarTo('vertical', distance);

      expect(await grid.spreaderPosition(), `spreader position at ${distance}px`).toBe('sticky');
      expectOnTrack(await grid.rowHeaderPlacements(), `at ${distance}px`);
    }

    await grid.releaseScrollbar();

    await expect.poll(() => grid.scrollDistance('vertical')).toBe(600);
    expect(await grid.spreaderPosition(), 'spreader position after release').toBe('relative');
    expectOnTrack(await grid.rowHeaderPlacements(), 'after release');
  });

  test('keeps the page scroll on release of a window-scrolled grid with no rows', async({ page, theme, bundle }) => {
    const grid = new ScrollbarDragEmptyGridPage(page, theme, bundle);

    await grid.goto({ mode: 'window' });

    const maxScroll = await grid.maxWindowScrollLeft();

    // The premise: the page must be wide enough to drag past the first step at all.
    expect(maxScroll, 'horizontal page scroll range').toBeGreaterThan(120);

    await grid.pressScrollbar();

    for (const distance of [10, 120, maxScroll]) {
      await grid.dragScrollbarTo('horizontal', distance);

      expect(await grid.spreaderPosition(), `spreader position at ${distance}px`).toBe('sticky');
      expectOnTrack(await grid.columnHeaderPlacements(), `at ${distance}px`);
    }

    await grid.releaseScrollbar();

    await expect.poll(() => grid.scrollDistance('horizontal')).toBe(maxScroll);
    expect(await grid.spreaderPosition(), 'spreader position after release').toBe('relative');
  });
});
