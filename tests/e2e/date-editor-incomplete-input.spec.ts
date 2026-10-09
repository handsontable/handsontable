import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { DateEditorPage } from '../fixtures/pages/DateEditorPage';

/**
 * A native `<input type="date">` reports `''` whenever its content is incomplete, which is
 * indistinguishable from a cleared input by its value alone. The date editor must not commit that
 * `''` as a request to clear the cell: an incomplete entry keeps the cell's date, and only a
 * deliberate clear erases it.
 *
 * Column 1 of the fixture is a `date` column with `allowInvalid: false`; row 0 holds 2024-06-10 and
 * row 2 is empty. Column 2 adds `allowEmpty: false`.
 */
test.describe('the date editor and an incomplete date', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: DateEditorPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DateEditorPage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the cell\'s date when Enter commits a segment cleared from the open input', async({ page, browserName }) => {
    if (browserName === 'firefox') {
      // Headless Firefox does not clear a segment of the open input, so there is no incomplete date to commit.
      return;
    }

    await grid.openEditorWithEnter(0, 1);

    if (browserName === 'chromium') {
      // Chromium shows the picker on open and the picker takes the keys. Escape closes it and leaves
      // the editor open; in the other engines the same key would close the editor.
      await page.keyboard.press('Escape');
    }

    await expect(grid.editorInput).toHaveValue('2024-06-10');

    await page.keyboard.press('Backspace');

    // A cleared segment makes the input report an empty value while the date is merely incomplete.
    await expect(grid.editorInput).toHaveValue('');

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    await expect(grid.cell(0, 1)).toHaveText('6/10/24');
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

  test('keeps the cell\'s date when a segment cleared from the open input is left by clicking another cell', async({ page, browserName }) => {
    if (browserName === 'firefox') {
      // Headless Firefox does not clear a segment of the open input, so there is no incomplete date to commit.
      return;
    }

    await grid.openEditorWithEnter(0, 1);

    if (browserName === 'chromium') {
      await page.keyboard.press('Escape');
    }

    await page.keyboard.press('Backspace');
    await expect(grid.editorInput).toHaveValue('');

    // Leaving the editor with a click commits it through the focusout path.
    await grid.selectCell(1, 0);

    await expect.poll(() => grid.isEditorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 1)).toBe('2024-06-10');
    await expect(grid.cell(0, 1)).toHaveText('6/10/24');
  });

  test('leaves the validator to refuse an incomplete date in a column with allowEmpty: false', async({ page, browserName }) => {
    if (browserName === 'firefox') {
      // Headless Firefox does not clear a segment of the open input, so there is no incomplete date to commit.
      return;
    }

    await grid.openEditorWithEnter(0, 2);

    if (browserName === 'chromium') {
      await page.keyboard.press('Escape');
    }

    await page.keyboard.press('Backspace');
    await expect(grid.editorInput).toHaveValue('');
    await page.keyboard.press('Enter');

    // allowInvalid: false keeps the editor open on the value the validator rejects.
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    expect(await grid.sourceAt(0, 2)).toBe('2024-06-10');
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
