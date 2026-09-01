import { test, expect } from '../fixtures/test';
import { NumericGridPage } from '../fixtures/pages/NumericGridPage';

/**
 * Formulas coverage for DEV-1161: with `preserveNumericLiteral` enabled, a lossy
 * entry such as `9.0` is stored as the literal string. The Formulas plugin passes
 * that raw content to HyperFormula, which parses numeric-looking strings as
 * numbers — so formula calculations (for example SUM) still include the cell.
 * The stored literal itself is untouched by the round-trip: the editor keeps
 * showing exactly what the user typed.
 */
test.describe('numeric preserved literal with formulas', () => {
  let grid: NumericGridPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new NumericGridPage(page, theme, 'numeric-formulas');
    await grid.goto();
  });

  test('SUM includes a preserved literal as its numeric value', async () => {
    // Seed data is [100, 2, 42] with B1 = SUM(A1:A3).
    await grid.expectCell(0, 1, '144');

    await grid.editCell(0, 0, '9.0');

    // The engine parses the preserved literal "9.0" as the number 9: 9 + 2 + 42.
    await grid.expectCell(0, 1, '53');
  });

  test('the editor keeps the preserved literal when the Formulas plugin is enabled', async () => {
    await grid.editCell(0, 0, '9.0');

    await grid.openEditor(0, 0);
    await expect(grid.editor).toHaveValue('9.0');
  });
});
