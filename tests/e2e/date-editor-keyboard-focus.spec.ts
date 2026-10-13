import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { DateEditorPage } from '../fixtures/pages/DateEditorPage';

/**
 * A date editor opened with the keyboard must hold the focus in its native `<input type="date">`.
 * Chromium and WebKit move the focus on `select()`; Firefox does not for a date input, so the editor
 * opened with the picker showing while the focus stayed on the cell and the typed digits were dropped.
 *
 * Row 0 of the fixture holds 2024-06-10 in column 1.
 */
test.describe('the date editor opened with the keyboard', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: DateEditorPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DateEditorPage(page, theme, bundle);
    await grid.goto();
  });

  test('focuses its input', async() => {
    await grid.openEditorWithEnter(0, 1);

    await expect(grid.editorInput).toBeFocused();
  });

  test('keeps the picker shown while the input has the focus', async({ browserName }) => {
    await grid.openEditorWithEnter(0, 1);
    await expect(grid.editorInput).toBeFocused();

    if (browserName !== 'webkit') {
      // WebKit does not match `:open` for a date input's picker.
      expect(await grid.editorInput.evaluate(input => input.matches(':open'))).toBe(true);
    }
  });

  test('takes the digits typed after Enter', async({ page, browserName }) => {
    await grid.openEditorWithEnter(0, 1);
    await expect(grid.editorInput).toBeFocused();

    if (browserName === 'chromium') {
      // The picker is open and would take the keys.
      await page.keyboard.press('Escape');
    }

    // The segment order follows the engine's locale, so only a change from the cell's 2024-06-10 is pinned.
    await page.keyboard.type('07042022');

    if (browserName !== 'webkit') {
      // Linux WebKit's date input takes no typed digits, with or without the focus, so only the focus is pinned there.
      await expect(grid.editorInput).not.toHaveValue('2024-06-10');
    }
  });

  test('closes the picker with the editor on Escape', async({ page, browserName }) => {
    await grid.openEditorWithEnter(0, 1);
    await expect(grid.editorInput).toBeFocused();

    // Chromium's first Escape closes only the picker and Firefox and WebKit close the editor with it,
    // so press until the editor is gone.
    await expect(async() => {
      await page.keyboard.press('Escape');
      expect(await grid.isEditorOpened()).toBe(false);
    }).toPass();

    if (browserName !== 'webkit') {
      // WebKit does not match `:open` for a date input's picker.
      expect(await grid.editorInput.evaluate(input => input.matches(':open'))).toBe(false);
    }
  });
});
