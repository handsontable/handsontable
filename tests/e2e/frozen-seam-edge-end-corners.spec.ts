import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FrozenSeamEdgeEndCornersPage } from '../fixtures/pages/FrozenSeamEdgeEndCornersPage';

/**
 * A selection edge that lies on a row freeze line is drawn by the frozen overlays, split by column: the `top`
 * or `bottom` overlay over the scrollable columns, and the corners over the frozen ones. The end corners
 * (`fixedColumnsEnd`) used to draw nothing there, while they paint over the `top` and `bottom` overlays'
 * slice, so the edge stopped short of the end column (DEV-3638).
 *
 * The grid has 100 rows and 100 columns, one frozen on each edge: the end column is 99, the first
 * `fixedRowsBottom` row is 99, and the last `fixedRowsTop` row is 0. A hit test, because the edge of an
 * overlay below the end corner is there but covered. Column 97 is the control: the `top` or `bottom` overlay
 * draws its slice, unchanged.
 *
 * Two scroll states: scrolled to the end, where the end band stands on the last scrollable column and
 * that column's border is the freeze line, and scrolled partway (column 40), where the end band's first
 * cell draws the freeze line itself. Partway, an edge started one pixel before the band stuck out past the
 * freeze line, outside the selection.
 */
const PARTWAY_COLUMN = 40;

[false, true].forEach((rtl) => {
  test.describe(`selection edge on a row freeze line, end corners (${rtl ? 'RTL' : 'LTR'})`, { tag: THEMES_TAG }, () => {
    let grid: FrozenSeamEdgeEndCornersPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FrozenSeamEdgeEndCornersPage(page, theme, bundle);
      await grid.goto({ rtl });
    });

    test('draws the bottom edge under the end column when it lies on the fixedRowsBottom line', async () => {
      await grid.scrollTo(98, 98);
      // Rows 92 to 98: the bottom edge is the line between row 98 and the first frozen bottom row.
      await grid.selectCells(92, 95, 98, 99);

      await expect.poll(() => grid.elementOnFreezeLine('bottom', 97))
        .toMatch(/^ht_clone_bottom\/div\.wtBorder area/);
      await expect.poll(() => grid.elementOnFreezeLine('bottom', 99))
        .toMatch(/^ht_clone_bottom_inline_end_corner\/div\.wtBorder area/);
    });

    test('draws the top edge over the end column when it lies on the fixedRowsTop line', async () => {
      await grid.scrollTo(1, 98);
      // Rows 1 to 5: the top edge is the line between the frozen top row and row 1.
      await grid.selectCells(1, 95, 5, 99);

      await expect.poll(() => grid.elementOnFreezeLine('top', 97))
        .toMatch(/^ht_clone_top\/div\.wtBorder area/);
      await expect.poll(() => grid.elementOnFreezeLine('top', 99))
        .toMatch(/^ht_clone_top_inline_end_corner\/div\.wtBorder area/);
    });

    test('closes the focus border of a single end-column cell on the freeze line', async () => {
      await grid.scrollTo(98, 98);
      await grid.selectCells(98, 99, 98, 99);

      await expect.poll(() => grid.elementOnFreezeLine('bottom', 99))
        .toMatch(/^ht_clone_bottom_inline_end_corner\/div\.wtBorder current/);
    });

    [
      { name: 'a range that crosses into the end column', from: 95 },
      { name: 'a range that starts in the end column', from: 99 },
    ].forEach(({ name, from }) => {
      test(`draws the bottom edge inside the freeze line, scrolled partway, for ${name}`, async () => {
        await grid.selectCells(92, from, 98, 99, { scrollToCell: false });
        await grid.scrollTo(98, PARTWAY_COLUMN);

        // A range that starts in the end column has its focus cell on the line, so its 2px border shows.
        await expect.poll(() => grid.elementOnFreezeLine('bottom', 99))
          .toMatch(/^ht_clone_bottom_inline_end_corner\/div\.wtBorder (area|current)/);
        // Outside the end band no selection is drawn, so no edge may reach past its first cell.
        await expect.poll(() => grid.endCornerEdgeOverhang('bottom', 99)).toBe(0);
      });

      test(`draws the top edge inside the freeze line, scrolled partway, for ${name}`, async () => {
        await grid.selectCells(1, from, 5, 99, { scrollToCell: false });
        await grid.scrollTo(1, PARTWAY_COLUMN);

        await expect.poll(() => grid.elementOnFreezeLine('top', 99))
          .toMatch(/^ht_clone_top_inline_end_corner\/div\.wtBorder (area|current)/);
        await expect.poll(() => grid.endCornerEdgeOverhang('top', 99)).toBe(0);
      });
    });

    test('draws no edge in the end corners for a selection away from the freeze lines', async () => {
      await grid.scrollTo(98, 98);
      // Rows 92 to 97: the bottom edge lies a row above the freeze line, so the corner has nothing to draw.
      await grid.selectCells(92, 95, 97, 99);

      // The positive control: the bottom edge is drawn, on row 97 of the end column.
      await expect.poll(() => grid.elementOnCellBottomEdge(97, 99)).toMatch(/\/div\.wtBorder area/);
      await expect.poll(() => grid.elementOnFreezeLine('bottom', 99))
        .toMatch(/^ht_clone_bottom_inline_end_corner\/td/);
    });
  });
});
