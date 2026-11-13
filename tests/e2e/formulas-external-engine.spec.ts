import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FormulasExternalEnginePage } from '../fixtures/pages/FormulasExternalEnginePage';

/**
 * An engine write made outside the grid repaints the formula cell. The plain cell keeps the
 * source value.
 */
test.describe('Formulas: an external engine write repaints formula cells', { tag: BUNDLES_TAG }, () => {
  let grid: FormulasExternalEnginePage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FormulasExternalEnginePage(page, theme, bundle);
  });

  test('updates the visible formula cell when engine.setCellContents runs outside the grid', async() => {
    await grid.goto();

    await grid.writeEngineCell(10);

    await expect(grid.cell(0, 1)).toHaveText('20');
    await expect(grid.cell(0, 0)).toHaveText('1');
  });
});
