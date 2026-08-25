import { test, expect } from '../fixtures/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

test.describe('formulaBuilder plugin', () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new FormulaBuilderPage(page, theme);
    await grid.goto();
  });

  test('renders the grid and formula bar with A1 selected', async () => {
    await expect(grid.formulaBar).toBeVisible();
    await grid.selectCell(0, 0);
    await expect(grid.addressInput).toHaveValue('A1');
  });

  test('clicking a cell syncs the formula-bar address', async () => {
    await grid.selectCell(0, 1);
    await expect(grid.addressInput).toHaveValue('B1');
  });

  test('seeded formulas compute through the engine', async () => {
    await grid.expectCell(0, 2, '3');
    await grid.expectCell(1, 2, '7');
    await grid.expectCell(2, 2, '10');
  });

  test('editing a cell recomputes through the engine', async () => {
    await grid.openEditor(0, 0);
    await grid.editorInput.click();
    await grid.editorInput.press('ControlOrMeta+a');
    await grid.editorInput.fill('=1+1');
    await grid.page.keyboard.press('Enter');
    await grid.expectCell(0, 0, '2');
    await grid.expectCell(0, 2, '4');
  });

  test('typing on a selected cell opens the editor seeded with the char', async () => {
    await grid.selectCell(3, 0);
    await grid.page.keyboard.press('9');
    await expect(grid.editorInput).toBeVisible();
    await expect(grid.editorInput).toHaveValue('9');
    await grid.page.keyboard.press('Escape');
  });

  test('typing a reference highlights the referenced cell through a native custom selection', async () => {
    await grid.openEditor(3, 0);
    await grid.editorInput.click();
    await grid.editorInput.press('ControlOrMeta+a');
    await grid.editorInput.fill('=A1');

    // The caret touches the ref token, so the referenced cell gets the generated
    // fill class and its selection border renders through Walkontable.
    await expect(grid.cell(0, 0)).toHaveClass(/ht-formula-ref-fill-\d+/);
    await expect(
      grid.page.locator('.ht_master [class*="wtBorder"][class*="ht-formula-ref-fill-"]').first(),
    ).toBeAttached();

    await grid.page.keyboard.press('Escape');

    // Cancelling the edit clears the highlight again.
    await expect(grid.cell(0, 0)).not.toHaveClass(/ht-formula-ref-fill-/);
  });
});
