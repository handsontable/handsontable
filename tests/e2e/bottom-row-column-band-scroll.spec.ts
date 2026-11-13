import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FrozenSeamEdgeEndCornersPage } from '../fixtures/pages/FrozenSeamEdgeEndCornersPage';

/**
 * The `fixedRowsBottom` row must stay under its columns while the grid scrolls. A vertical scroll that makes
 * the master re-render can also move the master's rendered column band: small horizontal scrolls before it
 * kept the old band (every column they showed was already rendered), and the re-render resolves the band for
 * the current horizontal offset. The bottom overlay only repositions on a vertical scroll, so its row kept
 * the cells of the old band behind the spreader offset of the new one, a whole column off.
 *
 * The grid has 100 rows and 100 columns, one frozen on each edge, and starts scrolled to the bottom-right
 * end. Each round scrolls a little toward the inline start, then up or down by a few rows. Which round moves
 * the band depends on the theme's column widths, so every column the bottom row renders is checked after
 * every step.
 *
 * The fix must keep the fast draw it narrows: a vertical scroll that leaves the column band where it is
 * repositions the `bottom` overlay without rendering its cells again, while the master renders the rows the
 * scroll brings in (the positive control).
 */
const STEPS: [number, number][] = Array.from({ length: 8 }, (_, round): [number, number][] => [
  [-20, 0],
  [0, round % 2 === 0 ? -60 : 60],
]).flat();

[false, true].forEach((rtl) => {
  test.describe(`fixedRowsBottom row against its columns while scrolling (${rtl ? 'RTL' : 'LTR'})`, { tag: THEMES_TAG }, () => {
    let grid: FrozenSeamEdgeEndCornersPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new FrozenSeamEdgeEndCornersPage(page, theme, bundle);
      await grid.goto({ rtl });
      await grid.scrollHolderToEnd();
    });

    [
      { name: 'the wheel scrolls the grid', scroll: (dx: number, dy: number) => grid.wheel(dx, dy) },
      { name: 'the holder is scrolled', scroll: (dx: number, dy: number) => grid.scrollHolderBy(dx, dy) },
    ].forEach(({ name, scroll }) => {
      test(`stays under its columns while ${name}`, async() => {
        for (const [deltaX, deltaY] of STEPS) {
          await scroll(rtl ? -deltaX : deltaX, deltaY);

          const offsets = await grid.bottomRowOffsets();

          expect(Object.keys(offsets).length).toBeGreaterThan(0);
          expect(offsets, `after a scroll of ${deltaX}, ${deltaY}`)
            .toEqual(Object.fromEntries(Object.keys(offsets).map(col => [col, 0])));
        }
      });
    });

    test('repositions the bottom row without rendering it again on a vertical scroll', async() => {
      await grid.scrollTo(40, 40);
      await grid.startRenderCounter();

      for (const deltaY of [120, 120, -120]) {
        await grid.wheel(0, deltaY);
      }

      const counts = await grid.renderCounts();

      expect(counts.otherRows).toBeGreaterThan(0);
      expect(counts.bottomRow).toBe(0);
    });
  });
});
