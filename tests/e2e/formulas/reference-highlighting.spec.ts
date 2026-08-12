import { test, expect } from '../../fixtures/test';
import { FormulasPage } from '../../fixtures/pages/FormulasPage';

test.describe('formula reference highlighting', () => {
  let formulas: FormulasPage;

  test.beforeEach(async ({ page, theme }) => {
    formulas = new FormulasPage(page, theme);
    await formulas.goto();
  });

  test('colors formula references in the editor overlay', async () => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(A1, B2)');

    await expect(formulas.editorReferenceHighlightLayer()).toBeVisible();
    await formulas.expectEditorReferenceToken('A1', 1);
    await formulas.expectEditorReferenceToken('B2', 2);
  });

  test('outlines referenced cells on the grid with matching colors', async () => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(A1, B2');

    await formulas.expectReferenceBorder(1);
    await formulas.expectReferenceBorder(2);
    await formulas.expectCellReferenceFill(1, 1, 2);
    await formulas.expectNoCellReferenceFill(0, 0);
  });

  test('reuses the same color for identical repeated references', async () => {
    await formulas.beginFormulaEdit(2, 2, '=A1+A1+B2');

    const a1Tokens = formulas.editorReferenceToken(1).filter({ hasText: 'A1' });
    const b2Tokens = formulas.editorReferenceToken(2).filter({ hasText: 'B2' });

    await expect(a1Tokens).toHaveCount(2);
    await expect(b2Tokens).toHaveCount(1);
    await formulas.expectReferenceBorder(1);
    await formulas.expectReferenceBorder(2);
  });

  test('moves the active fill highlight with the caret', async ({ page }) => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(A1, B2');
    await formulas.expectCellReferenceFill(1, 1, 2);
    await formulas.expectNoCellReferenceFill(0, 0);

    // Move from the end of B2 onto A1.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await formulas.expectCellReferenceFill(0, 0, 1);
    await formulas.expectNoCellReferenceFill(1, 1);
  });

  test('highlights a dragged range across multiple cells', async () => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(');
    await formulas.dragCellsWhileEditing(0, 0, 1, 1);

    await formulas.expectEditorValue('=SUM(A1:B2');
    await formulas.expectEditorReferenceToken('A1:B2', 1);
    await formulas.expectReferenceBorder(1);
    await formulas.expectCellReferenceFill(0, 0, 1);
    await formulas.expectCellReferenceFill(0, 1, 1);
    await formulas.expectCellReferenceFill(1, 0, 1);
    await formulas.expectCellReferenceFill(1, 1, 1);
  });

  test('updates highlights when a clicked reference replaces another', async () => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(');
    await formulas.clickCellWhileEditing(0, 0);
    await formulas.expectEditorValue('=SUM(A1');
    await formulas.expectEditorReferenceToken('A1', 1);
    await formulas.expectCellReferenceFill(0, 0, 1);

    await formulas.clickCellWhileEditing(1, 1);
    await formulas.expectEditorValue('=SUM(B2');
    await formulas.expectEditorReferenceToken('B2', 1);
    await formulas.expectCellReferenceFill(1, 1, 1);
    await formulas.expectNoCellReferenceFill(0, 0);
  });

  test('clears grid highlights when the editor closes', async ({ page }) => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(A1, B2');
    await formulas.expectReferenceBorder(1);
    await formulas.expectCellReferenceFill(1, 1, 2);

    await page.keyboard.press('Enter');
    await formulas.expectEditorClosed();
    await formulas.expectNoFormulaReferenceHighlights();
  });

  test('colors cross-sheet references in the editor overlay', async () => {
    await formulas.beginFormulaEdit(2, 2, '=Revenue!A1', 'expenses');

    await expect(formulas.editorReferenceHighlightLayer()).toBeVisible();
    await formulas.expectEditorReferenceToken('Revenue!A1', 1);
  });

  test('outlines cross-sheet referenced cells on the target sheet', async () => {
    await formulas.beginFormulaEdit(2, 2, '=Revenue!B2', 'expenses');

    await formulas.expectEditorReferenceToken('Revenue!B2', 1);
    await formulas.expectReferenceBorder(1, 'revenue');
    await formulas.expectCellReferenceFill(1, 1, 1, 'revenue');
    await formulas.expectNoReferenceBorder(1, 'expenses');
    await formulas.expectNoCellReferenceFill(1, 1, 'expenses');
  });

  test('highlights both local and cross-sheet references with distinct colors', async () => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(A1, Revenue!B2', 'expenses');

    await formulas.expectEditorReferenceToken('A1', 1);
    await formulas.expectEditorReferenceToken('Revenue!B2', 2);
    await formulas.expectReferenceBorder(1, 'expenses');
    await formulas.expectNoCellReferenceFill(0, 0, 'expenses');
    await formulas.expectReferenceBorder(2, 'revenue');
    await formulas.expectCellReferenceFill(1, 1, 2, 'revenue');
    await formulas.expectNoReferenceBorder(1, 'revenue');
  });

  test('highlights a cross-sheet range on the target sheet', async () => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(Revenue!A1:B2', 'expenses');

    await formulas.expectEditorReferenceToken('Revenue!A1:B2', 1);
    await formulas.expectReferenceBorder(1, 'revenue');
    await formulas.expectCellReferenceFill(0, 0, 1, 'revenue');
    await formulas.expectCellReferenceFill(0, 1, 1, 'revenue');
    await formulas.expectCellReferenceFill(1, 0, 1, 'revenue');
    await formulas.expectCellReferenceFill(1, 1, 1, 'revenue');
    await formulas.expectNoFormulaReferenceHighlights('expenses');
  });

  test('clears cross-sheet highlights on every sheet when the editor closes', async ({ page }) => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(A1, Revenue!B2', 'expenses');
    await formulas.expectReferenceBorder(1, 'expenses');
    await formulas.expectCellReferenceFill(1, 1, 2, 'revenue');

    await page.keyboard.press('Enter');
    await formulas.expectEditorClosed();
    await formulas.expectNoFormulaReferenceHighlights('expenses');
    await formulas.expectNoFormulaReferenceHighlights('revenue');
  });
});
