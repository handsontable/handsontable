import { test, expect } from '../fixtures/test';
import { NarrowListCellPage, type ListCellType } from '../fixtures/pages/NarrowListCellPage';

// The three cell types that render `htAutocompleteArrow`: `dropdown` and `handsontable` both
// delegate to `autocompleteRenderer` like `autocomplete`, so all three truncate. `date` and `time`
// carry no arrow and are out of scope.
const CELL_TYPES: ListCellType[] = ['autocomplete', 'dropdown', 'handsontable'];

/**
 * DEV-28 (dev-handsontable#2545). A long value in a narrow `autocomplete` / `dropdown` /
 * `handsontable` column wrapped onto several lines around the right-floated arrow. These list cell
 * types now keep their value on a single line and truncate it with an ellipsis (overriding
 * `wordWrap` / `textEllipsis` by design), and the arrow's width is reserved so the value never
 * reaches it.
 *
 * The load-bearing assertion is that the arrow sits at or past the cell's content-box edge - where
 * `overflow: hidden` clips the value and the ellipsis lands. Without the reserved padding that edge
 * falls to the right of the arrow, so the clipped value shows under it, while every other property
 * (one line, horizontal overflow, arrow on the trailing half) stays unchanged. The value's own box
 * is the UNCLIPPED single-line layout under `nowrap`, so it cannot be used for this - the content-box
 * edge is what the clip actually follows.
 */
CELL_TYPES.forEach((cellType) => {
  test.describe(`${cellType} narrow cell`, () => {
    let grid: NarrowListCellPage;

    test.beforeEach(({ page, theme, bundle }) => {
      grid = new NarrowListCellPage(page, theme, bundle, cellType);
    });

    test('truncates a long value to one line, clear of the arrow', async() => {
      await grid.goto({ mode: 'narrow' });

      const { content, arrow, contentBoxRight, scrollWidth, clientWidth, lineHeight } = await grid.metrics(0, 0);

      expect(content).not.toBeNull();
      expect(arrow).not.toBeNull();

      // One line (the pre-fix build wrapped this to several).
      expect((content as { height: number }).height).toBeLessThanOrEqual(lineHeight + 1);
      // The value genuinely overflows the column, so "one line" means truncated, not "it fit".
      expect(scrollWidth).toBeGreaterThan(clientWidth + 1);
      // The reserve: the arrow sits at or past the content-box edge, so the value clips before it
      // rather than under it.
      expect((arrow as { left: number }).left).toBeGreaterThanOrEqual(contentBoxRight - 1);
    });

    test('anchors the arrow beside the first line on a tall row', async() => {
      await grid.goto({ mode: 'tall' });

      const { arrow, cell, lineHeight, paddingTop } = await grid.metrics(0, 0);

      expect(arrow).not.toBeNull();

      // Precondition: the row is much taller than one line, so "beside the first line" and "centered
      // in the cell" are far apart.
      expect(cell.height).toBeGreaterThan(lineHeight * 2);

      const arrowCenterY = (arrow as { top: number, bottom: number }).top
        + ((arrow as { top: number, bottom: number }).bottom - (arrow as { top: number, bottom: number }).top) / 2;

      // The arrow stays beside the top-anchored first line, not centered in the tall cell.
      expect(arrowCenterY).toBeLessThanOrEqual(cell.top + paddingTop + lineHeight);
    });

    test('grows the column to fit the value under autoColumnSize (nothing truncated)', async() => {
      await grid.goto({ mode: 'autosize' });

      const { scrollWidth, clientWidth } = await grid.metrics(0, 0);

      // The reserved padding widens the AutoColumnSize ghost sample (it renders the real renderer),
      // so an autosized column fits the value plus the arrow and clips nothing.
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test('reserves the arrow at the leading edge in RTL', async() => {
      await grid.goto({ mode: 'narrow', dir: 'rtl' });

      const { content, arrow, cell, contentBoxLeft, lineHeight } = await grid.metrics(0, 0);

      expect(content).not.toBeNull();
      expect(arrow).not.toBeNull();

      // Still one line.
      expect((content as { height: number }).height).toBeLessThanOrEqual(lineHeight + 1);

      const cellCenterX = cell.left + (cell.width / 2);
      const arrowCenterX = (arrow as { left: number, right: number }).left
        + ((arrow as { left: number, right: number }).right - (arrow as { left: number, right: number }).left) / 2;

      // `inset-inline-end` flips to the visual left in RTL...
      expect(arrowCenterX).toBeLessThan(cellCenterX);
      // ...and the arrow sits at or past the content-box leading edge, so the value clips before it.
      expect((arrow as { right: number }).right).toBeLessThanOrEqual(contentBoxLeft + 1);
    });
  });
});
