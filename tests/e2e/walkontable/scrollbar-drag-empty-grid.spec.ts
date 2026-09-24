import { test, expect } from '../../fixtures/test';
import { ScrollbarDragEmptyGridPage } from '../../fixtures/pages/walkontable/ScrollbarDragEmptyGridPage';

/**
 * DEV-3083: dragging the horizontal scrollbar of a grid with no rows.
 *
 * During a native scrollbar drag the spreaders switch to `position: sticky`, and
 * `StickyScrollStrategy#syncOffsets` recomputes their insets from the first rendered row and column
 * after every scroll frame. A grid with no rows has no first rendered row, and the method used to
 * skip the update for BOTH axes when either start position was missing. The horizontal inset then
 * froze at its activation value while the rendered columns moved on: the column headers drifted
 * away from their columns (out of the viewport, for the user), and the release computed its scroll
 * correction from the stale inset and snapped the grid back towards the start.
 *
 * Both symptoms are asserted: the headers stay on their columns at every step of the drag, and the
 * release leaves the scroll where the drag put it. The distances cross several column boundaries so
 * the rendered column range - and with it the start position the inset follows - changes mid-drag.
 */
test.describe('Scrollbar drag on a grid with no rows', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    test(`keeps the column headers on their columns and keeps the scroll on release (${dir})`, async({
      page,
      theme,
      bundle,
    }) => {
      const grid = new ScrollbarDragEmptyGridPage(page, theme, bundle);

      await grid.goto(dir);
      await grid.pressScrollbar();

      for (const distance of [60, 250, 600]) {
        await grid.dragScrollbarTo(distance);

        // The drag strategy must own the spreader, or the ordinary scroll path is what is tested.
        expect(await grid.spreaderPosition(), `spreader position at ${distance}px`).toBe('sticky');

        const placements = await grid.headerPlacements();

        expect(placements.length, 'rendered column headers').toBeGreaterThan(0);

        for (const { column, actual, expected } of placements) {
          expect(Math.abs(actual - expected), `column ${column} header at ${distance}px`).toBeLessThanOrEqual(1);
        }
      }

      await grid.releaseScrollbar();

      await expect.poll(() => grid.scrollDistance()).toBe(600);
      expect(await grid.spreaderPosition(), 'spreader position after release').toBe('relative');

      for (const { column, actual, expected } of await grid.headerPlacements()) {
        expect(Math.abs(actual - expected), `column ${column} header after release`).toBeLessThanOrEqual(1);
      }
    });
  }
});
