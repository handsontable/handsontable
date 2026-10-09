import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { DateEditorPage } from '../fixtures/pages/DateEditorPage';

/**
 * A native `<input type="date">` reports `''` whenever its content is incomplete, which is
 * indistinguishable from a cleared input by its value alone. The date editor must not commit that
 * `''` as a request to clear the cell: an incomplete entry keeps the cell's date, and only a
 * deliberate clear erases it.
 *
 * Columns of the fixture, all `date` columns: 1 has `allowInvalid: false`, 2 adds `allowEmpty: false`,
 * and 3 has `allowEmpty: false` with the default `allowInvalid`. Row 0 holds 2024-06-10, row 1 holds
 * 2024-01-05, and row 2 is empty.
 */
test.describe('the date editor and an incomplete date', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: DateEditorPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DateEditorPage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the cell\'s date when a typed digit opens the editor and Enter commits it', async({ page, browserName }) => {
    await grid.selectCell(0, 1);
    await page.keyboard.press('1');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);

    // The input cannot take the character, so it holds nothing.
    await expect(grid.editorInput).toHaveValue('');

    if (browserName === 'chromium') {
      // The picker is open and would take the Enter.
      await page.keyboard.press('Escape');
    }

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    await expect(grid.cell(0, 1)).toHaveText('6/10/24');
  });

  test('keeps the cell\'s date when a typed letter opens the editor and another cell is clicked', async({ page }) => {
    await grid.selectCell(0, 1);
    await page.keyboard.press('a');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);

    // The input cannot hold the letter, and unlike an unfinished date it reports no bad input.
    await expect(grid.editorInput).toHaveValue('');
    expect(await grid.editorInput.evaluate(input => (input as HTMLInputElement).validity.badInput)).toBe(false);

    await grid.selectCell(1, 0);

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    await expect(grid.cell(0, 1)).toHaveText('6/10/24');
  });

  test('keeps the cell\'s date when a typed letter opens the editor and Enter commits it', async({ page, browserName }) => {
    await grid.selectCell(0, 1);
    await page.keyboard.press('a');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);

    if (browserName === 'chromium') {
      // The picker is open and would take the Enter.
      await page.keyboard.press('Escape');
    }

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
  });

  test('keeps the cell\'s date when a typed letter opens the editor and Tab leaves it', async({ page, browserName }) => {
    // Chromium's Tab moves between the segments of the open input and never leaves the editor, so there
    // is no commit to check there. The Tab commit is Firefox and WebKit's.
    if (browserName === 'chromium') {
      return;
    }

    await grid.selectCell(0, 1);
    await page.keyboard.press('a');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await page.keyboard.press('Tab');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
  });

  test('keeps the cell\'s date after a typed digit and a switch to full edit mode, without badInput', async({ page, browserName }) => {
    await grid.selectCell(0, 1);
    await page.keyboard.press('1');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);

    if (browserName === 'chromium') {
      await page.keyboard.press('Escape');
    }

    // Firefox does not flag the empty input as bad, so only the editor's own state can tell.
    await grid.hideBadInput();
    await expect(grid.editorInput).toHaveValue('');

    // Full edit mode does not seed an input that was opened by typing.
    await grid.enableFullEditMode();
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    await expect(grid.cell(0, 1)).toHaveText('6/10/24');
  });

  test('does not carry a seeded date into the next session on the same cell', async({ page, browserName }) => {
    // Escape closes the editor without moving the selection, so the editor is not prepared again.
    await grid.openEditorWithEnter(0, 1);

    if (browserName === 'chromium') {
      await page.keyboard.press('Escape');
    }

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Escape');
    await expect.poll(() => grid.isEditorOpened()).toBe(false);

    await page.keyboard.press('1');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await grid.hideBadInput();

    if (browserName === 'chromium') {
      await page.keyboard.press('Escape');
    }

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
  });

  test('still clears the cell when the input is cleared on purpose', async({ page, browserName }) => {
    await grid.openEditorWithEnter(0, 1);

    if (browserName === 'chromium') {
      await page.keyboard.press('Escape');
    }

    await grid.editorInput.fill('');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('');
  });

  test('still commits a complete date entered into the input', async({ page, browserName }) => {
    await grid.openEditorWithEnter(0, 1);

    if (browserName === 'chromium') {
      await page.keyboard.press('Escape');
    }

    await grid.editorInput.fill('2021-06-15');
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2021-06-15');
    await expect(grid.cell(0, 1)).toHaveText('6/15/21');
  });
});

/**
 * Clearing one segment of the open input. Chromium only: the picker's keyboard is the engine's own, and
 * headless Firefox does not clear a segment of the open input at all, so there is no incomplete date to
 * commit there. In Chromium, Escape closes the picker and leaves the editor open.
 */
test.describe('the date editor and a segment cleared from the open input', () => {
  let grid: DateEditorPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DateEditorPage(page, theme, bundle);
    await grid.goto();
  });

  /**
   * Opens the editor on a cell, closes the picker, and clears one segment of the date.
   */
  async function clearSegment(page: import('@playwright/test').Page, row: number, col: number): Promise<void> {
    await grid.openEditorWithEnter(row, col);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Backspace');

    // A cleared segment makes the input report an empty value while the date is merely incomplete.
    await expect(grid.editorInput).toHaveValue('');
  }

  test('keeps the cell\'s date when Enter commits it', async({ page }) => {
    await clearSegment(page, 0, 1);
    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    await expect(grid.cell(0, 1)).toHaveText('6/10/24');
  });

  test('keeps the cell\'s date when another cell is clicked', async({ page }) => {
    await clearSegment(page, 0, 1);

    // The editor closes through the selection change that the click causes.
    await grid.selectCell(1, 0);

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    await expect(grid.cell(0, 1)).toHaveText('6/10/24');
  });

  test('keeps the cell\'s date when Tab leaves the editor', async({ page }) => {
    await clearSegment(page, 0, 1);
    await page.keyboard.press('Tab');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    await expect(grid.cell(0, 1)).toHaveText('6/10/24');
  });

  test('keeps every selected cell\'s date when Ctrl+Enter would fill the selection', async({ page }) => {
    await grid.selectCell(0, 1);
    await page.keyboard.press('Shift+ArrowDown');
    // Enter moves the active cell inside a range, so F2 opens the editor.
    await page.keyboard.press('F2');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Backspace');
    await expect(grid.editorInput).toHaveValue('');
    await page.keyboard.press('ControlOrMeta+Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    expect(await grid.sourceAt(1, 1)).toBe('2024-01-05');
  });

  test('still fills the selection from an empty cell whose input was left untouched', async({ page }) => {
    await grid.selectCell(2, 1);
    await page.keyboard.press('Shift+ArrowUp');
    await page.keyboard.press('F2');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await page.keyboard.press('Escape');
    await expect(grid.editorInput).toHaveValue('');
    await page.keyboard.press('ControlOrMeta+Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(2, 1)).toBe('');
    expect(await grid.sourceAt(1, 1)).toBe('');
  });

  test('leaves the fill from an empty cell to the validator in a column that rejects the empty value', async({ page }) => {
    await grid.selectCell(2, 2);
    await page.keyboard.press('Shift+ArrowUp');
    await page.keyboard.press('F2');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await page.keyboard.press('Escape');

    // A typed digit starts a date, so the input is empty and incomplete.
    await page.keyboard.press('1');
    await expect(grid.editorInput).toHaveValue('');
    await page.keyboard.press('ControlOrMeta+Enter');

    // allowInvalid: false keeps the editor open on the value the validator rejects.
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    expect(await grid.sourceAt(1, 2)).toBe('2024-01-05');
  });

  test('keeps the editor open in a column that rejects the empty value and the invalid one', async({ page }) => {
    await clearSegment(page, 0, 2);
    await page.keyboard.press('Enter');

    // allowInvalid: false keeps the editor open on the value the validator rejects.
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    expect(await grid.sourceAt(0, 2)).toBe('2024-06-10');
  });

  test('keeps the cell\'s date in a column that rejects the empty value but allows the invalid one', async({ page }) => {
    await clearSegment(page, 0, 3);
    await page.keyboard.press('Enter');

    // With the default allowInvalid the empty value would be saved and marked invalid, erasing the date.
    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 3)).toBe('2024-06-10');
    await expect(grid.cell(0, 3)).toHaveText('6/10/24');
  });
});
