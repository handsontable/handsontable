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
 * Two scroll states: scrolled to the end and scrolled partway (column 40). In both the end band's first cell
 * draws the freeze line itself (its column reaches one pixel over the column before the band), so an edge
 * started one pixel before the band would stick out past the freeze line, outside the selection.
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
        // Outside the end band no selection is drawn, so the edge starts on the band's own edge.
        await expect.poll(() => grid.endCornerEdgeOffsets('bottom', 99)).toEqual([0]);
      });

      test(`draws the top edge inside the freeze line, scrolled partway, for ${name}`, async () => {
        await grid.selectCells(1, from, 5, 99, { scrollToCell: false });
        await grid.scrollTo(1, PARTWAY_COLUMN);

        await expect.poll(() => grid.elementOnFreezeLine('top', 99))
          .toMatch(/^ht_clone_top_inline_end_corner\/div\.wtBorder (area|current)/);
        await expect.poll(() => grid.endCornerEdgeOffsets('top', 99)).toEqual([0]);
      });
    });

    [
      { line: 'bottom' as const, row: 98, select: [92, 95, 98, 99] as const },
      { line: 'top' as const, row: 1, select: [1, 95, 5, 99] as const },
    ].forEach(({ line, row, select }) => {
      test(`starts the ${line} edge on the end band, scrolled to the end`, async () => {
        await grid.scrollTo(row, 98);
        await grid.selectCells(...select);

        // The band's first column reaches over the last scrollable column's border, so the band's own first
        // cell draws the freeze line here too, and the edge starts on it, not one pixel before it.
        await expect.poll(() => grid.endCornerEdgeOffsets(line, 99)).toEqual([0]);
      });

      test(`keeps the ${line} edge on the end band when scrolled from the end to partway`, async () => {
        // Selected at the end, then scrolled: the edge must follow the new scroll position at once, not
        // keep the one from before the scroll until the next render.
        await grid.scrollTo(row, 98);
        await grid.selectCells(select[0], 99, select[2], 99);
        await expect.poll(() => grid.endCornerEdgeOffsets(line, 99)).toEqual([0]);

        await grid.scrollTo(row, PARTWAY_COLUMN);

        await expect.poll(() => grid.endCornerEdgeOffsets(line, 99)).toEqual([0]);
      });
    });

    test('starts the edge on the end band for a numeric end column, scrolled partway', async () => {
      // A numeric cell is `dir="ltr"` in an RTL grid too, so its inline-start border is not on the grid's
      // inline-start side.
      await grid.goto({ rtl, numericEnd: true });
      await grid.selectCells(92, 95, 98, 99, { scrollToCell: false });
      await grid.scrollTo(98, PARTWAY_COLUMN);

      await expect.poll(() => grid.endCornerEdgeOffsets('bottom', 99)).toEqual([0]);
    });

    [
      { line: 'bottom' as const, row: 98, fromRow: 92, toRow: 98 },
      { line: 'top' as const, row: 1, fromRow: 1, toRow: 5 },
    ].forEach(({ line, row, fromRow, toRow }) => {
      test(`starts the ${line} edge on the gridline inside a two-column end band, scrolled partway`, async () => {
        // The band is columns 98 and 99. Only its first cell draws the freeze line itself; the gridline in
        // front of column 99 belongs to column 98, so an edge starting on column 99 starts on that gridline.
        await grid.goto({ rtl, fixedColumnsEnd: 2 });
        await grid.selectCells(fromRow, 99, toRow, 99, { scrollToCell: false });
        await grid.scrollTo(row, PARTWAY_COLUMN);

        await expect.poll(() => grid.endCornerEdgeOffsets(line, 99)).toEqual([1]);

        // The band's first column still starts on the band's own edge.
        await grid.selectCells(fromRow, 98, toRow, 99, { scrollToCell: false });

        await expect.poll(() => grid.endCornerEdgeOffsets(line, 98)).toEqual([0]);
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
