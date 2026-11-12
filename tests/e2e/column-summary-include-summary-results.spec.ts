import { test, expect } from '../fixtures/test';
import { ColumnSummaryNestedRowsPage } from '../fixtures/pages/ColumnSummaryNestedRowsPage';

/**
 * ColumnSummary `includeSummaryResults` over NestedRows (DEV-495): the total row counts the nested
 * subtotal row's result beside the leaves. Rows: 0 total, 1-2 leaves (5, 6), 3 subtotal, 4-6 leaves
 * (7, 8, 9).
 */
test.describe('column summary that includes a nested summary result', () => {
  let grid: ColumnSummaryNestedRowsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnSummaryNestedRowsPage(page, theme, bundle);
    await grid.goto();
  });

  test('shows the total of the leaves and the nested subtotal', async() => {
    await grid.initNestedSummaryGrid(true);

    await expect(grid.cell(3, 1)).toHaveText('24');
    // 5 + 6 + 24
    await expect(grid.cell(0, 1)).toHaveText('35');
  });

  test('updates both levels when a leaf is edited by keyboard', async() => {
    await grid.initNestedSummaryGrid(true);
    await expect(grid.cell(0, 1)).toHaveText('35');

    await grid.typeValue(5, 100);

    await expect(grid.cell(5, 1)).toHaveText('100');
    // 7 + 100 + 9
    await expect(grid.cell(3, 1)).toHaveText('116');
    // 5 + 6 + 116
    await expect(grid.cell(0, 1)).toHaveText('127');
  });

  test('keeps the total right while the nested group is collapsed', async() => {
    await grid.initNestedSummaryGrid(true);
    await expect(grid.cell(0, 1)).toHaveText('35');

    await grid.collapseButton(3).click();
    await expect(grid.cell(3, 1)).toHaveText('24');
    await expect(grid.cell(4, 1)).toBeHidden();

    await grid.typeValue(1, 50);

    await expect(grid.cell(1, 1)).toHaveText('50');
    // 50 + 6 + 24
    await expect(grid.cell(0, 1)).toHaveText('80');
  });

  test('restores both levels on undo', async() => {
    await grid.initNestedSummaryGrid(true);
    await expect(grid.cell(0, 1)).toHaveText('35');

    await grid.typeValue(5, 100);
    await expect(grid.cell(0, 1)).toHaveText('127');

    await grid.undoWithKeyboard();

    await expect(grid.cell(5, 1)).toHaveText('8');
    await expect(grid.cell(3, 1)).toHaveText('24');
    await expect(grid.cell(0, 1)).toHaveText('35');
  });

  // The control: without the option a summary result is not counted, so the total is the direct
  // leaves only (5 + 6).
  test('does not count the subtotal without the option (control)', async() => {
    await grid.initNestedSummaryGrid(false);

    await expect(grid.cell(3, 1)).toHaveText('24');
    await expect(grid.cell(0, 1)).toHaveText('11');
  });
});
