import { test, expect } from '../fixtures/test';
import { NumericGridPage } from '../fixtures/pages/NumericGridPage';

/**
 * Regression coverage for DEV-1161 / HOT-9714: a numeric cell used to lose the
 * user's literal when it was parsed to a JS number on save. Editing `9.0` showed
 * `9` in the editor, and large numbers lost precision. With the opt-in
 * `preserveNumericLiteral` option enabled (set in the fixture), the numeric
 * valueSetter keeps the original literal whenever converting it to a number would
 * lose information, so the editor shows exactly what the user typed. The cell
 * itself stays numerically formatted — only the editor preserves the literal, and
 * a preserved literal still sorts numerically.
 */
test.describe('numeric cell editor precision', () => {
  let grid: NumericGridPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new NumericGridPage(page, theme);
    await grid.goto();
  });

  test('keeps a trailing fractional zero in the editor after editing', async () => {
    await grid.editCell(0, 0, '9.0');

    // The cell renders the numerically formatted value...
    await grid.expectCell(0, 0, '9');

    // ...but reopening the editor shows the exact literal the user typed.
    await grid.openEditor(0, 0);
    await expect(grid.editor).toHaveValue('9.0');
  });

  test('keeps large-number precision in the editor after editing', async () => {
    const largeNumber = '12345678901234567.8';

    await grid.editCell(0, 0, largeNumber);
    await grid.openEditor(0, 0);

    await expect(grid.editor).toHaveValue(largeNumber);
  });

  test('leaves ordinary numeric values untouched (no regression)', async () => {
    await grid.editCell(0, 0, '9.5');
    await grid.expectCell(0, 0, '9.5');

    await grid.openEditor(0, 0);
    await expect(grid.editor).toHaveValue('9.5');
  });

  test('filters a preserved literal numerically with the "Is equal to" condition', async () => {
    // Seed data is [100, 2, 42]. Turn the first cell into a preserved literal ("9.0").
    await grid.editCell(0, 0, '9.0');

    // An equality filter for `9` must match the cell that holds the string "9.0":
    // the `eq` condition compares numeric-typed cells by value, not by text.
    await grid.filterByCondition('Is equal to', '9');

    await expect(grid.rows).toHaveCount(1);
    await grid.expectCell(0, 0, '9');
  });

  test('sorts a preserved literal numerically, not lexicographically', async () => {
    // Seed data is [100, 2, 42]. Turn the first cell into a preserved literal ("9.0").
    await grid.editCell(0, 0, '9.0');

    // Ascending sort must order by numeric value (2, 9, 42) — a lexicographic sort
    // of the rendered text would misorder them.
    await grid.sortColumn();

    await grid.expectCell(0, 0, '2');
    await grid.expectCell(1, 0, '9');
    await grid.expectCell(2, 0, '42');
  });
});
