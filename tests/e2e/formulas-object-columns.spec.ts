import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { FormulasObjectColumnsPage } from '../fixtures/pages/FormulasObjectColumnsPage';

/**
 * GitHub #13852: with Formulas enabled, a fill handle drag on a grid over object rows filled the
 * wrong values. The engine sheet is built from `getSourceDataArray()`, which stopped at the number of
 * keys in the first row (two here, `name` and `extra`) and dropped a column declared without `data`,
 * so the sheet was narrower than the grid and every column after the missing one sat one place off.
 * The fill then read the cell next to the source, or nothing at all.
 *
 * The fixture is 130 px tall, so the theme's row height decides where the last row ends and where its
 * fill handle sits (`FormulasObjectColumnsPage.selectCell()`): the spec runs on every theme.
 */
test.describe('Formulas: fill handle over object rows read through `columns`', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let grid: FormulasObjectColumnsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulasObjectColumnsPage(page, theme, bundle);
    await grid.goto();
  });

  test('hands the engine a column for every declared column', async() => {
    const columns = await grid.countCols();
    const [firstRow] = await grid.sourceDataArray();

    expect(columns).toBe(33);
    expect(firstRow).toHaveLength(columns);
    // The column without `data` keeps its slot (empty), so `extra.0` stays at visual column 2.
    expect(firstRow[0]).toBe('Row 1');
    expect(firstRow[1] ?? null).toBeNull();
    expect(firstRow.slice(2, 4)).toEqual([200, 201]);
    // The trailing column without `data` keeps its slot as well.
    expect(firstRow[columns - 1] ?? null).toBeNull();
  });

  test('fills the value of the source cell, not of its neighbor, when the source sits just after the column without data', async() => {
    const source = grid.extraColumn(0);

    await grid.selectCell(0, source);
    await grid.dragFillHandleTo(0, source + 2);

    await expect(grid.cell(0, source + 1)).toHaveText('200');
    await expect(grid.cell(0, source + 2)).toHaveText('200');
  });

  test('fills the value of the source cell when the source column lies past the keys of the first row', async() => {
    const source = grid.extraColumn(20);

    await grid.selectCell(1, source);
    await grid.dragFillHandleTo(1, source + 3);

    // `extra.20` of the second row is 320; the cells after it held 321, 322 and 323.
    await expect(grid.cell(1, source + 1)).toHaveText('320');
    await expect(grid.cell(1, source + 2)).toHaveText('320');
    await expect(grid.cell(1, source + 3)).toHaveText('320');
  });
});
