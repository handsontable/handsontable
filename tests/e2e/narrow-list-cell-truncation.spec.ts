import { test, expect } from '../fixtures/test';
import { NarrowListCellPage, type ListCellType } from '../fixtures/pages/NarrowListCellPage';

// The two cell types that render `htAutocompleteArrow` and used to wrap around it. `date` and `time`
// carry no arrow, and `handsontable`/`multiselect` are covered for their own indicators elsewhere.
const CELL_TYPES: ListCellType[] = ['autocomplete', 'dropdown'];

/**
 * DEV-28 (#2545). A long value in a narrow `autocomplete` / `dropdown` column wrapped onto several
 * lines around the right-floated arrow, breaking the cell's layout. The fix keeps the text on one
 * line and truncates it with an ellipsis, and reserves the arrow's width so nothing sits under it.
 *
 * The wrap check compares the long cell's rendered height against a SHORT cell in the same column,
 * not a hardcoded pixel count: row heights are per-row, so a wrapping long value grows only its own
 * row, and the short cell gives the single-line height for the active theme. The long cell is also
 * asserted to actually overflow its column (`scrollWidth > clientWidth`), so the equal height means
 * "truncated to one line", never "the value happened to fit".
 */
CELL_TYPES.forEach((cellType) => {
  test.describe(`${cellType} narrow cell`, () => {
    let grid: NarrowListCellPage;

    test.beforeEach(({ page, theme, bundle }) => {
      grid = new NarrowListCellPage(page, theme, bundle, cellType);
    });

    test('keeps a long value on one line instead of wrapping around the arrow', async() => {
      await grid.goto({ mode: 'narrow' });

      const long = await grid.metrics(0, 0);
      const short = await grid.metrics(1, 0);

      // The long value must overflow the 60px column, or the height comparison below is vacuous.
      expect(long.scrollWidth).toBeGreaterThan(long.clientWidth + 1);

      // Truncated to a single line: no taller than the same column's single-line short cell. On the
      // pre-fix build the long cell wrapped to ~3 lines and stood far taller.
      expect(long.height).toBeLessThanOrEqual(short.height + 1);
    });

    test('pins the arrow at the trailing edge of the cell', async() => {
      await grid.goto({ mode: 'narrow' });

      const long = await grid.metrics(0, 0);

      // The fix must not hide or displace the arrow while reserving its space: it stays out of flow
      // on the cell's trailing (right, in LTR) half.
      expect(long.arrowCenterX).not.toBeNull();
      expect(long.arrowCenterX as number).toBeGreaterThan(long.cellCenterX);
    });

    test('grows the column to fit the value under autoColumnSize (nothing truncated)', async() => {
      await grid.goto({ mode: 'autosize' });

      const long = await grid.metrics(0, 0);

      // The reviewer's explicit constraint: with autosize on, the column must fit the whole value.
      // `nowrap` widens the AutoColumnSize ghost sample too (it renders the real renderer), so the
      // measured width includes the reserved arrow space and the content is never clipped.
      expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth + 1);
    });

    test('pins the arrow at the leading edge and keeps one line in RTL', async() => {
      await grid.goto({ mode: 'narrow', dir: 'rtl' });

      const long = await grid.metrics(0, 0);
      const short = await grid.metrics(1, 0);

      // `inset-inline-end` flips to the visual left in RTL, so the arrow sits on the left half.
      expect(long.arrowCenterX).not.toBeNull();
      expect(long.arrowCenterX as number).toBeLessThan(long.cellCenterX);

      // Still one line, same as LTR.
      expect(long.scrollWidth).toBeGreaterThan(long.clientWidth + 1);
      expect(long.height).toBeLessThanOrEqual(short.height + 1);
    });
  });
});
