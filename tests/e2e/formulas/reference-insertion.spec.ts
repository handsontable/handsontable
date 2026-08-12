import { test, expect } from '../../fixtures/test';
import { FormulasPage } from '../../fixtures/pages/FormulasPage';

test.describe('formula reference insertion', () => {
  let formulas: FormulasPage;

  test.beforeEach(async ({ page, theme }) => {
    formulas = new FormulasPage(page, theme);
    await formulas.goto();
  });

  test('inserts a cell reference when clicking a cell while editing a formula', async () => {
    await formulas.beginFormulaEdit(0, 0, '=SUM(');
    await formulas.clickCellWhileEditing(1, 1);
    await formulas.expectEditorValue('=SUM(B2');
  });

  test('inserts a range reference when dragging while editing a formula', async () => {
    await formulas.beginFormulaEdit(0, 0, '=SUM(');
    await formulas.dragCellsWhileEditing(0, 1, 2, 2);
    await formulas.expectEditorValue('=SUM(B1:C3');
  });

  test('inserts a whole-column reference when clicking a column header', async ({ page }) => {
    await formulas.beginFormulaEdit(0, 0, '=SUM(');
    await formulas.clickColumnHeaderWhileEditing(0);
    await formulas.expectEditorValue('=SUM(A:A');
    await formulas.expectEditorFocused();
    await page.keyboard.type(')');
    await formulas.expectEditorValue('=SUM(A:A)');
  });

  test('inserts a whole-row reference when clicking a row header', async ({ page }) => {
    await formulas.beginFormulaEdit(0, 0, '=SUM(');
    await formulas.clickRowHeaderWhileEditing(0);
    await formulas.expectEditorValue('=SUM(1:1');
    await formulas.expectEditorFocused();
    await page.keyboard.type(')');
    await formulas.expectEditorValue('=SUM(1:1)');
  });

  test('keeps the editor focused after inserting a reference', async ({ page }) => {
    await formulas.beginFormulaEdit(0, 0, '=SUM(');
    await formulas.clickCellWhileEditing(1, 1);
    await formulas.expectEditorValue('=SUM(B2');
    await formulas.expectEditorFocused();
    await page.keyboard.type(')');
    await formulas.expectEditorValue('=SUM(B2)');
  });

  test('replaces a reference when clicking another cell', async () => {
    await formulas.beginFormulaEdit(0, 0, '=SUM(');
    await formulas.clickCellWhileEditing(1, 0);
    await formulas.expectEditorValue('=SUM(A2');
    await formulas.clickCellWhileEditing(1, 1);
    await formulas.expectEditorValue('=SUM(B2');
  });

  test('replaces the reference when extending a horizontal drag past the initial range', async ({ page }) => {
    await formulas.beginFormulaEdit(2, 2, '=');

    const editor = formulas.editor();
    const a1 = formulas.cell(0, 0);
    const b1 = formulas.cell(0, 1);
    const b2 = formulas.cell(1, 1);

    const boxA1 = await a1.boundingBox();
    const boxB1 = await b1.boundingBox();
    const boxB2 = await b2.boundingBox();

    if (!boxA1 || !boxB1 || !boxB2) {
      throw new Error('missing bounding boxes');
    }

    await page.mouse.move(boxA1.x + boxA1.width / 2, boxA1.y + boxA1.height / 2);
    await page.mouse.down();

    await page.mouse.move(boxB1.x + boxB1.width / 2, boxB1.y + boxB1.height / 2, { steps: 3 });
    await expect(editor).toHaveValue('=A1:B1');

    await page.mouse.move(boxB2.x + boxB2.width / 2, boxB2.y + boxB2.height / 2, { steps: 3 });
    await expect(editor).toHaveValue('=A1:B2');

    await page.mouse.up();
    await expect(editor).toHaveValue('=A1:B2');
  });

  test('inserts a reference at the caret after typing additional formula text', async ({ page }) => {
    await formulas.beginFormulaEdit(2, 2, '=SUM(');
    await formulas.clickCellWhileEditing(0, 0);
    await formulas.expectEditorValue('=SUM(A1');

    await page.keyboard.type(', ');
    await new Promise(r => setTimeout(r, 0)); // this is needed for some reason maybe because of the unavoidable setTimeout in the implementation
    await formulas.clickCellWhileEditing(0, 1);
    await formulas.expectEditorValue('=SUM(A1, B1');
  });

  test('supports undo and redo for reference insertions', async ({ page }) => {
    await formulas.beginFormulaEdit(0, 0, '=SUM(');
    await formulas.clickCellWhileEditing(1, 1);
    await formulas.expectEditorValue('=SUM(B2');
    await page.keyboard.press('ControlOrMeta+Z');
    await formulas.expectEditorValue('=SUM(');
    await page.keyboard.press('ControlOrMeta+Shift+Z');
    await formulas.expectEditorValue('=SUM(B2');
  });

  test('supports undo and redo for reference replacements', async ({ page }) => {
    await formulas.beginFormulaEdit(0, 0, '=SUM(');
    await formulas.clickCellWhileEditing(1, 0);
    await formulas.expectEditorValue('=SUM(A2');
    await formulas.clickCellWhileEditing(1, 1);
    await formulas.expectEditorValue('=SUM(B2');
    await page.keyboard.press('ControlOrMeta+Z');
    await formulas.expectEditorValue('=SUM(A2');
    await page.keyboard.press('ControlOrMeta+Shift+Z');
    await formulas.expectEditorValue('=SUM(B2');
  });
});
