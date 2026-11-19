import { test, expect } from '../fixtures/test';
import { ValidateHiddenCellsPage } from '../fixtures/pages/ValidateHiddenCellsPage';

/**
 * DEV-3736. `validateCells()`, `validateRows()` and `validateColumns()` walk `countRows()` and
 * `countCols()`, which include the rows hidden by HiddenRows and the columns hidden by
 * HiddenColumns (neither trims). An invalid value in a hidden line must fail the validation, or an
 * app that gates a save on `validateCells(callback)` would get `valid === true` for invalid data.
 *
 * Every scenario reads a control that targets a valid line, so a callback that is always `false`
 * cannot pass.
 */
test.describe('validation of hidden rows and columns', () => {
  let grid: ValidateHiddenCellsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ValidateHiddenCellsPage(page, theme, bundle);
    await grid.goto();
  });

  test('validates a cell in a hidden row', async() => {
    await grid.configure({ invalid: [3, 0], hiddenRows: [3] });

    expect(await grid.isRowHidden(3)).toBe(true);
    expect(await grid.validateCells()).toBe(false);
    expect(await grid.validateRows([3])).toBe(false);
    expect(await grid.validateRows([0])).toBe(true);

    await grid.showRows([3]);

    expect(await grid.isRowHidden(3)).toBe(false);
    expect(await grid.validateCells()).toBe(false);
    expect(await grid.validateRows([3])).toBe(false);
    expect(await grid.validateRows([0])).toBe(true);
  });

  test('validates a cell in a hidden column', async() => {
    await grid.configure({ invalid: [0, 2], hiddenColumns: [2] });

    expect(await grid.isColumnHidden(2)).toBe(true);
    expect(await grid.validateCells()).toBe(false);
    expect(await grid.validateColumns([2])).toBe(false);
    expect(await grid.validateColumns([0])).toBe(true);

    await grid.showColumns([2]);

    expect(await grid.isColumnHidden(2)).toBe(false);
    expect(await grid.validateCells()).toBe(false);
    expect(await grid.validateColumns([2])).toBe(false);
    expect(await grid.validateColumns([0])).toBe(true);
  });

  test('reports a hidden line without an invalid value as valid while the visible one fails', async() => {
    await grid.configure({ invalid: [0, 0], hiddenRows: [3], hiddenColumns: [2] });

    expect(await grid.validateRows([3])).toBe(true);
    expect(await grid.validateColumns([2])).toBe(true);
    expect(await grid.validateCells()).toBe(false);
  });
});
