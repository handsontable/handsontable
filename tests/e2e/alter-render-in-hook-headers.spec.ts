import { test, expect } from '../fixtures/test';
import { AlterRenderInHookHeadersPage } from '../fixtures/pages/AlterRenderInHookHeadersPage';

/**
 * `alter()` fires `afterCreateCol` and `afterRemoveCol` before it rewrites the array `colHeaders`, and renders
 * once more when it is done. A `hot.render()` made from the hook consumed the pending full render, so that
 * closing render was a fast draw and left the header row as the hook had painted it: every label sat over
 * another column than the one it names.
 *
 * The cases named "control" pass without the fix: `alter()` never rewrites a `rowHeaders` array, and a grid whose
 * hook does not render was never affected. They pin that the fix does not change those.
 */
test.describe('array headers after a render fired from an alter() hook', () => {
  let grid: AlterRenderInHookHeadersPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AlterRenderInHookHeadersPage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the labels on their columns when a column is inserted', async() => {
    await grid.renderFromHook('afterCreateCol');
    await grid.alter('insert_col_start', 1);

    // The inserted column has no entry in the array, so it shows the spreadsheet label of its position.
    await expect(grid.colHeaders()).toHaveText(['A1', 'B', 'B1', 'C1', 'D1', 'E1', 'F1']);
    expect(await grid.apiColHeaders()).toEqual(['A1', 'B', 'B1', 'C1', 'D1', 'E1', 'F1']);
  });

  test('keeps the labels on their columns when a column is removed', async() => {
    await grid.renderFromHook('afterRemoveCol');
    await grid.alter('remove_col', 1);

    await expect(grid.colHeaders()).toHaveText(['A1', 'C1', 'D1', 'E1', 'F1']);
    expect(await grid.apiColHeaders()).toEqual(['A1', 'C1', 'D1', 'E1', 'F1']);
  });

  test('selects the column a label names after the insert', async() => {
    await grid.renderFromHook('afterCreateCol');
    await grid.alter('insert_col_start', 1);

    // `B1` moved from column 1 to column 2.
    await grid.colHeaders().getByText('B1', { exact: true }).click();

    expect(await grid.selectedColumn()).toBe(2);
  });

  test('keeps the column offsets in step with the widths when a column is inserted', async() => {
    await grid.useMixedColumnWidths();
    await grid.renderFromHook('afterCreateCol');
    await grid.alter('insert_col_start', 1);
    await grid.scrollToLastColumn();

    // The widths are 50, 50 (the inserted column), 200, 50, 200, 50, 200, so at the end of the scroll range the
    // grid shows column 4 only in part and the last two columns in full.
    await expect.poll(() => grid.firstFullyVisibleColumn()).toBe(5);
  });

  test('repaints the headers when a hook throws after the header array was rewritten', async() => {
    await grid.selectCell(0, 2);
    await grid.renderFromHook('afterCreateCol');
    await grid.throwFromAfterSelectionOnce();

    // The selection shift runs after the rewrite and before the closing render, which the throw skips.
    expect(await grid.alterExpectingError('insert_col_start', 1)).toBe('thrown from afterSelection');
    expect(await grid.apiColHeaders()).toEqual(['A1', 'B', 'B1', 'C1', 'D1', 'E1', 'F1']);

    // A selection move draws without asking for a full render, so it keeps whatever header row is there.
    await grid.selectCell(0, 0);

    await expect(grid.colHeaders()).toHaveText(['A1', 'B', 'B1', 'C1', 'D1', 'E1', 'F1']);
  });

  test('control: draws the same headers without a render from the hook', async() => {
    await grid.alter('insert_col_start', 1);

    await expect(grid.colHeaders()).toHaveText(['A1', 'B', 'B1', 'C1', 'D1', 'E1', 'F1']);
  });

  test('control: keeps the row headers in step with the API when a row is inserted', async() => {
    await grid.renderFromHook('afterCreateRow');
    await grid.alter('insert_row_above', 1);

    await expect(grid.rowHeaders()).toHaveText(await grid.apiRowHeaders());
  });

  test('control: keeps the row headers in step with the API when a row is removed', async() => {
    await grid.renderFromHook('afterRemoveRow');
    await grid.alter('remove_row', 1);

    await expect(grid.rowHeaders()).toHaveText(await grid.apiRowHeaders());
  });
});
