import { test, expect } from '@playwright/test';
import { GridPage } from '../fixtures/pages/GridPage';

test.describe('editor escape', () => {
  // A granular, library-level interaction: Handsontable implements the editor
  // lifecycle, so we drive real keys and assert the observable outcome — the
  // cell text and where the next edit lands — via stable data-testid hooks.
  test('Escape discards the in-progress edit and keeps the selection on the cell', async({ page }) => {
    const grid = new GridPage(page);

    await grid.goto();

    // Open the editor on B2, type a replacement, then bail out with Escape.
    await grid.cell(1, 1).dblclick();
    const editor = page.locator('.handsontableInput');

    await expect(editor).toBeVisible();
    await editor.fill('discarded');
    await editor.press('Escape');

    // The original value survives the cancelled edit.
    await grid.expectCell(1, 1, 'B2');

    // The selection stayed put: a fast-edit commits into the same cell.
    await grid.typeIntoSelected('kept');
    await grid.expectCell(1, 1, 'kept');
  });
});
