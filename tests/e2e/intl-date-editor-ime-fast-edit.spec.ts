import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { IntlDateEditorImeFastEditPage } from '../fixtures/pages/IntlDateEditorImeFastEditPage';

/**
 * `imeFastEdit` on an `intl-date` column. The editor's input has to hold the browser focus from the moment a
 * cell is selected and through the editing that follows: an input that loses the focus while characters are
 * entered breaks the IME composition of Asian-language users (#839).
 *
 * The focus does not move at the selection itself. The focus manager moves it with a debounced `select()` once
 * the selection ends, so the specs wait for it with a web-first `toBeFocused()` instead of reading the active
 * element right after selecting. Focus and DOM identity do not depend on the theme or the bundle, so the spec
 * declares no leg tags and runs on `e2e-main`. It carries `CROSS_BROWSER_TAG` because Firefox does not treat
 * `select()` on a date input as a focus move, so only an engine leg pins that the refocus calls `focus()`.
 *
 * Fixture: `intl-date` in column 0, a plain text column beside it, `imeFastEdit: true`.
 */
test.describe('imeFastEdit with the intl-date editor', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: IntlDateEditorImeFastEditPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new IntlDateEditorImeFastEditPage(page, theme, bundle);
    await grid.goto();
  });

  // Selecting a date cell hands the browser focus to the editor's input without opening the editor, so an IME
  // can start composing at once, and the focus stays there instead of falling back to the cell.
  test('moves the focus to the editor input when a cell is selected and keeps it there', async() => {
    await grid.selectCell(0, 0);

    await expect(grid.editorInput).toBeFocused();
    expect(await grid.isEditorOpened()).toBe(false);

    // Positive control: the wait above proved the focus arrived. Now let frames pass and look again.
    expect(await grid.editorInputStillFocusedAfterFrames()).toBe(true);
  });

  // Opening the editor with Enter and typing into it must not take the focus off the input: a focus that moves
  // while characters are entered ends an IME composition (#839).
  test('keeps the focus on the editor input when Enter opens the editor and characters are typed', async({ page }) => {
    await grid.selectCell(0, 0);
    await expect(grid.editorInput).toBeFocused();

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect(grid.editorInput).toBeFocused();
    expect(await grid.editorInputStillFocusedAfterFrames()).toBe(true);

    for (const character of ['t', 'e', 'o']) {
      await page.keyboard.press(character);

      await expect(grid.editorInput).toBeFocused();
      expect(await grid.editorInputStillFocusedAfterFrames()).toBe(true);
    }

    expect(await grid.isEditorOpened()).toBe(true);
  });
});
