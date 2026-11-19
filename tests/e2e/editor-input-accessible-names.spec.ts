import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { EditorInputAccessibleNamesPage } from '../fixtures/pages/EditorInputAccessibleNamesPage';

/**
 * Every control that edits a cell is named after that cell, so a screen reader says which cell the
 * user is editing: `<column>, row <n>` for a cell editor and `Comment for <column>, row <n>` for the
 * comment editor, where `<column>` is the header text a user reads and `<n>` the number the row header shows.
 * Each test reaches the editor with the keyboard and reads the name the accessibility tree computes.
 */
test.describe('editor input accessible names', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: EditorInputAccessibleNamesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EditorInputAccessibleNamesPage(page, theme, bundle);
    await grid.goto();
  });

  test('names the text editor after its cell, and the name follows the selection', async({ page }) => {
    await grid.build({
      data: [['Ann', 31], ['Bob', 42], ['Cid', 53]],
      colHeaders: ['Name', 'Age'],
      rowHeaders: true,
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('textbox', { name: 'Age, row 2', exact: true })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => grid.selectedCell()).toEqual([2, 0]);
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('textbox', { name: 'Name, row 3', exact: true })).toBeFocused();
    await expect(grid.editorInput).toHaveAccessibleName('Name, row 3');
  });

  test('names a column without a label by its spreadsheet letter', async({ page }) => {
    await grid.build({
      data: [['a', 'b'], ['c', 'd']],
      colHeaders: true,
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('textbox', { name: 'B, row 1', exact: true })).toBeFocused();
  });

  test('numbers the row the way its row header does when the headers are bound to the rows', async({ page }) => {
    await grid.build({
      data: [['Ann'], ['Bob'], ['Cid']],
      colHeaders: ['Name'],
      rowHeaders: true,
      bindRowsWithHeaders: true,
      columnSorting: { initialConfig: { column: 0, sortOrder: 'desc' } },
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('rowheader', { name: '3', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Name, row 3', exact: true })).toBeFocused();
  });

  test('names the row by the text of a custom row header', async({ page }) => {
    await grid.build({
      data: [['Revenue'], ['Costs'], ['Margin']],
      colHeaders: ['Metric'],
      rowHeaders: ['Q1', 'Q2', 'Q3'],
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('rowheader', { name: 'Q2', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Metric, Q2', exact: true })).toBeFocused();
  });

  test('keeps the name a custom editor gives its own input', async({ page }) => {
    await grid.registerSelfLabelledEditor('selfLabelled', 'My custom label');
    await grid.build({
      data: [['Ann', 'first'], ['Bob', 'second']],
      colHeaders: ['Name', 'Note'],
      columns: [{}, { editor: 'selfLabelled' }],
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('textbox', { name: 'My custom label', exact: true })).toBeFocused();
  });

  test('keeps the name a custom editor gives its own input with ariaTags disabled', async({ page }) => {
    await grid.registerSelfLabelledEditor('selfLabelled', 'My custom label');
    await grid.build({
      data: [['Ann', 'first'], ['Bob', 'second']],
      colHeaders: ['Name', 'Note'],
      columns: [{}, { editor: 'selfLabelled' }],
      ariaTags: false,
    });
    await grid.selectCell(1, 1);

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('textbox', { name: 'My custom label', exact: true })).toBeFocused();
  });

  test('names the select editor after its cell', async({ page }) => {
    await grid.build({
      data: [['Ann', 'S'], ['Bob', 'M']],
      colHeaders: ['Name', 'Size'],
      columns: [{}, { editor: 'select', selectOptions: ['S', 'M', 'L'] }],
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('combobox', { name: 'Size, row 2', exact: true })).toBeFocused();
  });

  test('names the native date editor input after its cell', async({ page }) => {
    await grid.build({
      data: [['Kickoff', '2024-01-05'], ['Review', '2024-06-10']],
      colHeaders: ['Event', 'Start'],
      columns: [{}, { type: 'date', locale: 'en-US', dateFormat: { dateStyle: 'short' } }],
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);

    const dateInput = page.locator('input[type="date"].handsontableInput');

    await expect(dateInput).toBeFocused();
    await expect(dateInput).toHaveAccessibleName('Start, row 2');
  });

  test('names the dropdown editor combobox after its cell', async({ page }) => {
    await grid.build({
      data: [['Ann', 'Red'], ['Bob', 'Blue']],
      colHeaders: ['Name', 'Color'],
      columns: [{}, { type: 'dropdown', source: ['Red', 'Green', 'Blue'] }],
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('combobox', { name: 'Color, row 1', exact: true })).toBeFocused();
  });

  test('names the comment editor opened with Ctrl+Alt+M after its cell', async({ page }) => {
    await grid.build({
      data: [['Ann', ''], ['Bob', '']],
      colHeaders: ['Name', 'Note'],
      comments: true,
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Control+Alt+M');

    await expect(grid.commentInput).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Comment for Note, row 2', exact: true })).toBeFocused();
  });

  test('reads a header with markup as the text a user sees', async({ page }) => {
    await grid.build({
      data: [['Ann', 31], ['Bob', 42]],
      colHeaders: ['<b>First</b><br>name', 'Age'],
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('textbox', { name: 'First name, row 1', exact: true })).toBeFocused();
  });

  test('translates the name with the grid language', async({ page }) => {
    await grid.build({
      data: [['Ann', 31], ['Bob', 42]],
      colHeaders: ['Name', 'Age'],
      language: 'pl-PL',
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(page.getByRole('textbox', { name: 'Name, wiersz 2', exact: true })).toBeFocused();
  });

  test('writes no name with ariaTags disabled', async({ page }) => {
    await grid.build({
      data: [['Ann', 31], ['Bob', 42]],
      colHeaders: ['Name', 'Age'],
      ariaTags: false,
    });
    await grid.selectCell(0, 0);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.editorInput).not.toHaveAttribute('aria-label');
    await expect(grid.editorInput).toHaveAccessibleName('');
  });
});
