import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { EditorValidationWaitPage } from '../fixtures/pages/EditorValidationWaitPage';

/**
 * The editor waits for the validation of the value it saved, and only for that one. Column B
 * validates asynchronously (600 ms, negatives rejected, `allowInvalid: false`), and column C holds
 * `=B<n>*2`, numeric, so the Formulas plugin validates C whenever B changes. `postAfterValidate` is
 * instance-wide, and the editor used to take the first answer of any cell as its own:
 *
 * - the dependent C cell answered first (valid), the editor closed at once, and B's own rejection
 *   then landed on nothing, so the typed value was gone;
 * - during a `validateCells()` batch the batch's first answer (row 12, B = -5, invalid; the batch
 *   walks the rows from last to first) reopened the editor, and the editor's own answer, which came
 *   later, no longer reached it: Enter never closed the editor.
 *
 * Both happened with the FormulaBuilder editor and the plain text editor alike.
 */
test.describe('Editor validation wait: the formula editor', { tag: BUNDLES_TAG }, () => {
  test('an async rejection reopens the formula editor with the typed value', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'formula');

    await grid.goto();
    await grid.typeInCell(1, 1, '-7');
    await page.keyboard.press('Enter');

    // B's own answer has come, after C's.
    await expect(grid.validationsAnswered).toHaveText('1');
    await expect.poll(() => grid.editorOpened()).toBe(true);
    await expect(grid.formulaEditorInput).toBeVisible(); // reopened
    await expect(grid.formulaEditorInput).toHaveValue('-7');
    await expect(grid.cell(1, 1)).toHaveText('18');
    expect(await grid.dataAt(1, 1)).toBe(18);
  });

  test('Enter during a validateCells() batch closes the editor and moves down', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'formula');

    await grid.goto();
    // The batch first: a click on the button outside the grid would end an edit already open.
    await grid.clickValidateCells();
    await grid.clickCell(1, 1);
    await grid.openEditorOnSelectedCell();
    await expect(grid.barEditorOverlay).toBeVisible();
    await page.keyboard.press('Enter');

    // The edit ran inside the batch: its validations were still in flight at the Enter.
    expect(await grid.validationsPendingAtEnter()).toBeGreaterThan(0);
    // Every answer has come: the batch's 12 and the editor's own.
    await expect(grid.validationsPending).toHaveText('0');
    await expect(grid.validationsAnswered).toHaveText('13');
    // The batch's last validated cell is invalid.
    expect(await grid.cellValid(11, 1)).toBe(false);

    await expect.poll(() => grid.editorOpened()).toBe(false);
    await expect(grid.barEditorOverlay).toBeHidden();
    await expect(grid.selectedRow).toHaveAttribute('aria-rowindex', '3');
    await expect(grid.selectedRow.locator('td.current')).toHaveAttribute('data-testid', 'cell-2-1');
  });
});

test.describe('Editor validation wait: the plain text editor behaves the same (control)', { tag: BUNDLES_TAG }, () => {
  test('an async rejection reopens the text editor with the typed value', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'text');

    await grid.goto();
    await grid.typeInCell(1, 1, '-7');
    await page.keyboard.press('Enter');

    await expect(grid.validationsAnswered).toHaveText('1');
    await expect.poll(() => grid.editorOpened()).toBe(true);
    await expect(grid.textEditorInput).toBeFocused(); // reopened
    await expect(grid.textEditorInput).toHaveValue('-7');
    await expect(grid.cell(1, 1)).toHaveText('18');
    expect(await grid.dataAt(1, 1)).toBe(18);
  });

  test('Enter during a validateCells() batch closes the text editor and moves down', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'text');

    await grid.goto();
    await grid.clickValidateCells();
    await grid.clickCell(1, 1);
    await grid.openEditorOnSelectedCell();
    await page.keyboard.press('Enter');

    expect(await grid.validationsPendingAtEnter()).toBeGreaterThan(0);
    await expect(grid.validationsPending).toHaveText('0');
    await expect(grid.validationsAnswered).toHaveText('13');
    expect(await grid.cellValid(11, 1)).toBe(false);

    await expect.poll(() => grid.editorOpened()).toBe(false);
    await expect(grid.selectedRow).toHaveAttribute('aria-rowindex', '3');
    await expect(grid.selectedRow.locator('td.current')).toHaveAttribute('data-testid', 'cell-2-1');
  });
});
