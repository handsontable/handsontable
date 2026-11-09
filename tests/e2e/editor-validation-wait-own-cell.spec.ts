import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { EditorValidationWaitPage } from '../fixtures/pages/EditorValidationWaitPage';

/**
 * The editor waits for the validation of the value it saved, and only for that one. Column B
 * validates asynchronously (negatives rejected, `allowInvalid: false`; the fixture holds every
 * answer until the test releases it), and column C holds `=B<n>*2`, numeric, so the Formulas plugin
 * validates C, synchronously, whenever B changes. `postAfterValidate` is instance-wide, and the
 * editor used to take the first answer of any cell as its own:
 *
 * - the dependent C cell answered first (valid), the editor closed at once, and B's own rejection
 *   then landed on nothing, so the typed value was gone;
 * - during a `validateCells()` batch the batch's first answer (row 12, B = -5, invalid; the batch
 *   walks the rows from last to first) reopened the editor, and the editor's own answer, which came
 *   later, no longer reached it: Enter never closed the editor.
 *
 * Both happened with the FormulaBuilder editor and the plain text editor alike. Since the Formulas plugin
 * writes a validated value into the engine only once the validator accepts it, C is no longer
 * recalculated (or validated) while B's answer is held: it keeps the old result, and follows an accepted
 * value after the answer.
 */

/**
 * Types a rejected value over B2, commits it, and releases B's held answer.
 *
 * @param {EditorValidationWaitPage} grid The page object, already on the fixture.
 */
async function expectRejectionReopensEditor(grid: EditorValidationWaitPage): Promise<void> {
  await grid.typeInCell(1, 1, '-7');
  await grid.page.keyboard.press('Enter');

  // B's answer is held, and the editor still waits on it.
  await expect.poll(() => grid.heldValidations()).toEqual([expect.objectContaining({ row: 1 })]);
  expect(await grid.editorState()).toBe('STATE_WAITING');

  // The engine gets B's value only once the validator accepts it, so C2 keeps showing 36 (B2 = 18) meanwhile.
  await expect(grid.cell(1, 2)).toHaveText('36');
  expect(await grid.dataAt(1, 2)).toBe(36);

  expect(await grid.releaseNextValidation()).toMatchObject({ row: 1 });

  await expect.poll(() => grid.editorOpened()).toBe(true); // reopened
  await expect(grid.editorInput()).toBeVisible();
  await expect(grid.editorInput()).toBeFocused();
  await expect(grid.editorInput()).toHaveValue('-7');
  await expect(grid.cell(1, 1)).toHaveText('18');
  expect(await grid.dataAt(1, 1)).toBe(18);

  // The rejected -7 never reached the engine, so C2 still reads 18, before and after the user gives up
  // the edit.
  await expect(grid.cell(1, 2)).toHaveText('36');
  await grid.page.keyboard.press('Escape');
  await expect.poll(() => grid.editorOpened()).toBe(false);
  await expect(grid.cell(1, 2)).toHaveText('36');
  expect(await grid.dataAt(1, 2)).toBe(36);
}

/**
 * Types an accepted value over B2 and commits it: C2 keeps the old result while B's answer is held, and
 * follows the new value once the validator accepts it.
 *
 * @param {EditorValidationWaitPage} grid The page object, already on the fixture.
 */
async function expectAcceptedValueUpdatesDependent(grid: EditorValidationWaitPage): Promise<void> {
  await grid.typeInCell(1, 1, '10');
  await grid.page.keyboard.press('Enter');

  await expect.poll(() => grid.heldValidations()).toEqual([expect.objectContaining({ row: 1 })]);
  await expect(grid.cell(1, 2)).toHaveText('36');
  expect(await grid.dataAt(1, 2)).toBe(36);

  expect(await grid.releaseNextValidation()).toMatchObject({ row: 1 });

  await expect.poll(() => grid.editorOpened()).toBe(false);
  await expect(grid.cell(1, 1)).toHaveText('10');
  await expect(grid.cell(1, 2)).toHaveText('20');
  expect(await grid.dataAt(1, 2)).toBe(20);
}

/**
 * With an async validator on C too, commits an accepted value over B2 and undoes it with the keyboard
 * right after the apply, while C2's validation (asked by the apply) is still held: the edit's undo step
 * must not wait for it.
 *
 * @param {EditorValidationWaitPage} grid The page object, on the fixture with `goto('held')`.
 */
async function expectUndoRightAfterApply(grid: EditorValidationWaitPage): Promise<void> {
  await grid.typeInCell(1, 1, '10');
  await grid.page.keyboard.press('Enter');
  await expect.poll(() => grid.heldValidations()).toEqual([expect.objectContaining({ row: 1 })]);
  await grid.releaseNextValidation();

  await expect(grid.cell(1, 2)).toHaveText('20');
  await expect.poll(() => grid.heldDependentValidationCount()).toBe(1);
  expect(await grid.undoAvailable()).toBe(true);

  await grid.page.keyboard.press('ControlOrMeta+z');

  await expect(grid.cell(1, 1)).toHaveText('18');
  await expect(grid.cell(1, 2)).toHaveText('36');
}

/**
 * Starts a `validateCells()` batch, confirms an unchanged edit of B2 while the batch is held, and
 * releases the batch's answers before the editor's own.
 *
 * @param {EditorValidationWaitPage} grid The page object, already on the fixture.
 */
async function expectBatchLeavesEditorWaiting(grid: EditorValidationWaitPage): Promise<void> {
  // The batch first: a click on the button outside the grid would end an edit already open.
  await grid.clickValidateCells();
  await expect.poll(async() => (await grid.heldValidations()).length).toBe(12);
  await grid.clickCell(1, 1);
  await grid.openEditorOnSelectedCell();
  await grid.page.keyboard.press('Enter');

  // The editor's own validation is asked last, behind the 12 the batch holds, row 12's first.
  await expect.poll(async() => (await grid.heldValidations()).length).toBe(13);
  const held = await grid.heldValidations();

  expect(held[0]).toMatchObject({ row: 11, value: -5 });
  expect(held[12]).toMatchObject({ row: 1 });
  expect(await grid.editorState()).toBe('STATE_WAITING');

  for (let answer = 0; answer < 12; answer += 1) {
    await grid.releaseNextValidation(); // eslint-disable-line no-await-in-loop
  }

  // The batch has answered, row 12's rejection included, and none of it ended the editor's wait.
  expect(await grid.cellValid(11, 1)).toBe(false);
  expect(await grid.editorState()).toBe('STATE_WAITING');

  expect(await grid.releaseNextValidation()).toMatchObject({ row: 1 });

  await expect.poll(() => grid.editorOpened()).toBe(false);
  await expect(grid.selectedRow).toHaveAttribute('aria-rowindex', '3');
  await expect(grid.selectedRow.locator('td.current')).toHaveAttribute('data-testid', 'cell-2-1');
}

test.describe('Editor validation wait: the formula editor', { tag: BUNDLES_TAG }, () => {
  test('an async rejection reopens the formula editor with the typed value', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'formula');

    await grid.goto();
    await expectRejectionReopensEditor(grid);
  });

  test('an accepted value reaches the dependent formula only after the validator answers', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'formula');

    await grid.goto();
    await expectAcceptedValueUpdatesDependent(grid);
  });

  test('an accepted edit is undone right after the apply while a dependent is still validated', async({
    page, theme, bundle,
  }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'formula');

    await grid.goto('held');
    await expectUndoRightAfterApply(grid);
  });

  test('Enter during a validateCells() batch closes the editor and moves down', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'formula');

    await grid.goto();
    await expectBatchLeavesEditorWaiting(grid);
    await expect(grid.barEditorOverlay).toBeHidden();
  });
});

test.describe('Editor validation wait: the plain text editor behaves the same (control)', { tag: BUNDLES_TAG }, () => {
  test('an async rejection reopens the text editor with the typed value', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'text');

    await grid.goto();
    await expectRejectionReopensEditor(grid);
  });

  test('an accepted value reaches the dependent formula only after the text editor\'s validator answers', async({
    page, theme, bundle,
  }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'text');

    await grid.goto();
    await expectAcceptedValueUpdatesDependent(grid);
  });

  test('Enter during a validateCells() batch closes the text editor and moves down', async({ page, theme, bundle }) => {
    const grid = new EditorValidationWaitPage(page, theme, bundle, 'text');

    await grid.goto();
    await expectBatchLeavesEditorWaiting(grid);
  });
});
