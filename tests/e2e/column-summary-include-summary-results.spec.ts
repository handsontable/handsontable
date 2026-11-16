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

  // A collapse is an undo step of its own, so no keyboard path changes a leaf while its group is
  // collapsed: the first undo expands the group, and the second one reverts the leaf.
  test('keeps both levels right through the undo of a collapse and then of a leaf edit', async() => {
    await grid.initNestedSummaryGrid(true);
    await expect(grid.cell(0, 1)).toHaveText('35');

    await grid.typeValue(5, 100);
    await expect(grid.cell(3, 1)).toHaveText('116');
    await expect(grid.cell(0, 1)).toHaveText('127');

    await grid.collapseButton(3).click();
    await expect(grid.cell(4, 1)).toBeHidden();
    expect(await grid.undoStackSize()).toBe(2);

    await grid.undoWithKeyboard();

    // The group is expanded again, and the edited leaf still counts on both levels.
    await expect(grid.cell(5, 1)).toHaveText('100');
    await expect(grid.cell(3, 1)).toHaveText('116');
    await expect(grid.cell(0, 1)).toHaveText('127');

    await grid.undoWithKeyboard();

    await expect(grid.cell(5, 1)).toHaveText('8');
    await expect(grid.cell(3, 1)).toHaveText('24');
    await expect(grid.cell(0, 1)).toHaveText('35');
    expect(await grid.undoStackSize()).toBe(0);
  });

  // The function form with one range per child, built from the data tree in physical rows (the shape
  // of the docs example `example13`), through a collapse and an expand. The static-range test above
  // covers the collapse for the array form.
  test('keeps both levels right through a collapse with endpoints built from the data tree', async() => {
    await grid.initTreeSummaryGrid();
    await expect(grid.cell(3, 1)).toHaveText('24');
    await expect(grid.cell(0, 1)).toHaveText('35');

    await grid.collapseButton(3).click();
    await expect(grid.cell(4, 1)).toBeHidden();

    await grid.typeValue(1, 50);

    await expect(grid.cell(1, 1)).toHaveText('50');
    // 50 + 6 + 24
    await expect(grid.cell(0, 1)).toHaveText('80');

    await grid.collapseButton(3).click();

    await expect(grid.cell(4, 1)).toHaveText('7');
    // 7 + 8 + 9
    await expect(grid.cell(3, 1)).toHaveText('24');
    await expect(grid.cell(0, 1)).toHaveText('80');
  });

  test('restores both levels on undo', async() => {
    await grid.initNestedSummaryGrid(true);
    await expect(grid.cell(0, 1)).toHaveText('35');

    await grid.typeValue(5, 100);
    await expect(grid.cell(0, 1)).toHaveText('127');
    // The leaf edit and both summary writes are one undo step.
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undoWithKeyboard();

    await expect(grid.cell(5, 1)).toHaveText('8');
    await expect(grid.cell(3, 1)).toHaveText('24');
    await expect(grid.cell(0, 1)).toHaveText('35');

    await grid.redoWithKeyboard();

    await expect(grid.cell(5, 1)).toHaveText('100');
    // 7 + 100 + 9
    await expect(grid.cell(3, 1)).toHaveText('116');
    // 5 + 6 + 116
    await expect(grid.cell(0, 1)).toHaveText('127');
  });

  // The control: without the option a summary result is not counted, so the total is the direct
  // leaves only (5 + 6).
  test('does not count the subtotal without the option (control)', async() => {
    await grid.initNestedSummaryGrid(false);

    await expect(grid.cell(3, 1)).toHaveText('24');
    await expect(grid.cell(0, 1)).toHaveText('11');

    await grid.typeValue(5, 100);

    // The subtotal follows its leaf, and the total does not follow the subtotal.
    await expect(grid.cell(3, 1)).toHaveText('116');
    await expect(grid.cell(0, 1)).toHaveText('11');
  });
});
