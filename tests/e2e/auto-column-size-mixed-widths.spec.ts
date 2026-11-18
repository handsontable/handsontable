import { test, expect, THEMES_TAG } from '../fixtures/test';
import { AutoColumnSizeMergedCellsPage } from '../fixtures/pages/AutoColumnSizeMergedCellsPage';

const LONG = 'A very long string that will not fit into the cell so it needs more space';
const DATA = [
  ['H', LONG, 1],
  ['He', 'b', 2],
  [LONG, 'c', 3],
];

/**
 * The column width guide mixes fixed and auto-sized columns by giving `width` to some entries of
 * `columns` and leaving the others empty. A column with a `width` keeps it whatever its content, and
 * a column without one is measured by AutoColumnSize. The grid has `width: '100%'`, as in the guide:
 * an empty column must not read that grid-level value as its own width.
 *
 * The measured column is compared with the same data in a grid with no widths at all, built in the
 * same theme and bundle, because the text width is the theme's.
 */
test.describe('autoColumnSize and a width on some columns only', { tag: THEMES_TAG }, () => {
  let grid: AutoColumnSizeMergedCellsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoColumnSizeMergedCellsPage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the fixed widths and measures the column without one', async() => {
    const control = await grid.build({ data: DATA });

    expect(control[1]).toBeGreaterThan(300);

    const widths = await grid.build({
      data: DATA,
      width: '100%',
      columns: [{ width: 90 }, {}, { width: 60 }],
    });

    expect(widths).toEqual([90, control[1], 60]);
    expect(await grid.fitsOnOneLine(0, 1, 1)).toBe(true);
    expect(await grid.fitsOnOneLine(2, 0, 1)).toBe(false);
  });
});
