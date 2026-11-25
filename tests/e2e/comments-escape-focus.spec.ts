import { test, expect, THEMES_TAG } from '../fixtures/test';
import { CommentsEditorResizePage } from '../fixtures/pages/CommentsEditorResizePage';

const COMMENT = 'A comment that has to stay visible while it is resized.';

/**
 * Closing the comment editor from the keyboard returns the browser focus to the cell, and Escape
 * hides a comment that a hover opened (WCAG 2.4.3 and 1.4.13).
 *
 * Before the fix, Escape and Ctrl/Cmd+Enter hid the focused editor and left the focus on the
 * document body: the grid still answered the arrow keys, but a screen reader had nothing focused.
 * A comment opened by a hover is not focused, so the plugin's own Escape shortcut never ran for it
 * and nothing but a pointer move could hide it.
 *
 * Not on the engine legs: this fixture's grid scrolls inside its holder, and such a grid throws in the
 * constructor on Playwright's WebKit (`resolveProxyScrollbarColor()` reads a `scrollbar-color` that
 * engine does not compute), so the fixture never builds there. The spec passes on Firefox.
 */
test.describe('Comments: Escape and the focus after the editor closes', { tag: THEMES_TAG }, () => {
  let grid: CommentsEditorResizePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CommentsEditorResizePage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('the editor opened with Ctrl+Alt+M', () => {
    test.beforeEach(async({ page }) => {
      await grid.selectCell(1, 1);
      await page.keyboard.press('Control+Alt+m');

      await expect(grid.editor).toBeVisible();
      await expect(grid.textarea).toBeFocused();
    });

    test('Escape closes it without saving and returns the focus to the cell', async({ page }) => {
      await page.keyboard.type(' Discarded.');
      await page.keyboard.press('Escape');

      await expect(grid.editor).toBeHidden();
      await expect(grid.cell(1, 1)).toBeFocused();
      expect(await grid.highlightedCell()).toEqual([1, 1]);
      // The blur that follows the hide saves the editor's text. Escape put the old text back first.
      await expect.poll(() => grid.storedComment(1, 1)).toBe(COMMENT);
      // The focus is back on the cell, so the blur and its save have run: an unchanged save
      // records no undo step.
      expect(await grid.undoAvailable()).toBe(false);
    });

    test('Ctrl/Cmd+Enter saves the comment and returns the focus to the cell', async({ page }) => {
      await page.keyboard.type(' Call Ana.');
      await page.keyboard.press('ControlOrMeta+Enter');

      await expect(grid.editor).toBeHidden();
      await expect(grid.cell(1, 1)).toBeFocused();
      await expect.poll(() => grid.storedComment(1, 1)).toBe(`${COMMENT} Call Ana.`);

      // The save is one undo step, not two: one undo restores the comment and leaves nothing to undo.
      await grid.undo();

      expect(await grid.storedComment(1, 1)).toBe(COMMENT);
      expect(await grid.undoAvailable()).toBe(false);
    });

    test('the grid answers the arrow keys from the cell the focus returned to', async({ page }) => {
      await page.keyboard.press('Escape');
      await expect(grid.cell(1, 1)).toBeFocused();

      await page.keyboard.press('ArrowDown');

      await expect(grid.cell(2, 1)).toBeFocused();
      expect(await grid.highlightedCell()).toEqual([2, 1]);
    });
  });

  test('Escape returns the focus to the selected cell when the comment belongs to another one', async({ page }) => {
    // An editor the application opened over a cell other than the selected one, which the user then
    // typed into. The selection is where the keyboard continues, so the focus returns there.
    await grid.selectCell(4, 1);
    await grid.showAtCell(1, 1);
    await grid.textarea.focus();
    await expect(grid.textarea).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(grid.editor).toBeHidden();
    await expect(grid.cell(4, 1)).toBeFocused();
    expect(await grid.highlightedCell()).toEqual([4, 1]);
    await expect.poll(() => grid.storedComment(1, 1)).toBe(COMMENT);
  });

  test('Escape leaves a comment the API opened on screen', async({ page }) => {
    // An application may show a comment on purpose. Only a hover's comment is dismissed.
    await grid.selectCell(4, 1);
    await grid.showAtCell(1, 1);
    await expect(grid.editor).toBeVisible();

    await page.keyboard.press('Escape');
    // The positive control: the grid took the key, so an arrow key right after it moves the selection.
    await page.keyboard.press('ArrowDown');

    expect(await grid.highlightedCell()).toEqual([5, 1]);
    await expect(grid.editor).toBeVisible();
  });

  test.describe('a comment opened by a hover', () => {
    test.beforeEach(async({ page }) => {
      await page.clock.install();
      // The grid listens, as it does for a user who has worked in it, so Escape reaches it.
      await grid.selectCell(4, 1);
      await grid.openEditorByHover(1, 1);

      expect(await grid.editorIsFocused()).toBe(false);
    });

    test('Escape hides it while the pointer rests on its cell', async({ page }) => {
      await page.keyboard.press('Escape');

      await expect(grid.editor).toBeHidden();

      // The pointer has not moved: nothing may show the comment again, however long it rests.
      await page.clock.runFor(2000);

      await expect(grid.editor).toBeHidden();
      expect(await grid.highlightedCell()).toEqual([4, 1]);
      expect(await grid.storedComment(1, 1)).toBe(COMMENT);
    });

    test('the comment shows again after the pointer leaves the cell and comes back', async({ page }) => {
      await page.keyboard.press('Escape');
      await expect(grid.editor).toBeHidden();

      await grid.hoverCellWithoutComment();
      await page.clock.runFor(400);
      await grid.openEditorByHover(1, 1);

      await expect(grid.textarea).toHaveValue(COMMENT);
    });

    test('Escape does not cancel the key for the page around the grid', async({ page }) => {
      await page.evaluate(() => {
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            (window as unknown as { escapePrevented?: boolean }).escapePrevented = event.defaultPrevented;
          }
        });
      });

      await page.keyboard.press('Escape');

      await expect(grid.editor).toBeHidden();
      expect(await page.evaluate(() => (window as unknown as { escapePrevented?: boolean }).escapePrevented))
        .toBe(false);
    });
  });
});
