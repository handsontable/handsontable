import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FormulasValidatedWritePage } from '../fixtures/pages/FormulasValidatedWritePage';

/**
 * A formula typed into a validated column while a hook updates the settings in the same task. The
 * Core applies the validated change in a microtask, after the Formulas plugin wrote it into the
 * engine and after the `updateSettings()` rebuilt the sheet from source data that did not hold it
 * yet - so the cell kept showing the raw `=SUM(A1:A2)` text. The plugin now writes the change back
 * when the Core applies it.
 */
test.describe('Formulas: a validated write across a settings update', { tag: BUNDLES_TAG }, () => {
  test('shows the result of a formula typed in the editor, not its raw text', async ({ page, theme, bundle }) => {
    const grid = new FormulasValidatedWritePage(page, theme, bundle);

    await grid.goto();
    await grid.typeInEditor(2, 0, '=SUM(A1:A2)');

    await expect(grid.cell(2, 0)).toHaveText('3');
    expect(await grid.sourceDataAtCell(2, 0)).toBe('=SUM(A1:A2)');
  });
});
