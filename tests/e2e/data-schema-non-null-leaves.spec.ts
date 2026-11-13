import { test, expect } from '../fixtures/test';
import { DataSchemaNonNullLeavesPage } from '../fixtures/pages/DataSchemaNonNullLeavesPage';

/**
 * Object data with a `dataSchema` whose leaves are not `null` and no `columns` option drew the
 * right number of columns, but registered a property for none of them: every column read `null`
 * and rendered blank, although the data held values. Every schema leaf now maps to a column,
 * whatever its default value.
 */
test.describe('dataSchema with non-null leaves and no columns', () => {
  let grid: DataSchemaNonNullLeavesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DataSchemaNonNullLeavesPage(page, theme, bundle);
    await grid.goto();
  });

  test('renders the values of every schema leaf, nested ones included', async() => {
    await expect(grid.cell(0, 0)).toHaveText('1');
    await expect(grid.cell(0, 1)).toHaveText('alpha');
    await expect(grid.cell(0, 2)).toHaveText('true');
    await expect(grid.cell(1, 1)).toHaveText('beta');
    await expect(grid.cell(1, 2)).toHaveText('false');
    expect(await grid.countCols()).toBe(3);
    expect(grid.pageErrors).toEqual([]);
  });

  test('writes an edit back to the source row', async() => {
    await grid.typeIntoCell(0, 1, 'edited');

    expect(await grid.sourceRow(0)).toEqual({ id: 1, name: 'edited', meta: { active: true } });
    expect(grid.pageErrors).toEqual([]);
  });
});
