import { test, expect } from '../fixtures/test';
import { CommentsEditorResizePage } from '../fixtures/pages/CommentsEditorResizePage';

// leg-declarations: ignore pointer-offset -- this spec drives the plugin API only and never calls the pointer helpers

/**
 * `Comments#showAtCell()` opens the comment editor for any cell, including one with no comment.
 * The editor is then empty, so a comment can be authored. The "Add comment" context menu item and
 * the Ctrl+Alt+M shortcut call `show()` on such cells and depend on it, so this is a contract and
 * not an accident: gating it on an existing comment would break both.
 */
test.describe('Comments#showAtCell on a cell without a comment', () => {
  let grid: CommentsEditorResizePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CommentsEditorResizePage(page, theme, bundle);
    await grid.goto();
  });

  test('opens an empty editor and returns true', async() => {
    expect(await grid.storedComment(2, 2)).toBeUndefined();

    expect(await grid.showAtCell(2, 2)).toBe(true);

    await expect(grid.editor).toBeVisible();
    await expect(grid.textarea).toHaveValue('');
  });

  test('clears the text of a previously shown comment', async() => {
    const stored = await grid.storedComment(1, 1);

    expect(stored).toBeTruthy();

    await grid.showAtCell(1, 1);
    await expect(grid.textarea).toHaveValue(stored!);

    await grid.showAtCell(2, 2);

    await expect(grid.editor).toBeVisible();
    await expect(grid.textarea).toHaveValue('');
  });

  test('writes no comment when the empty editor is hidden again without focus', async() => {
    await grid.showAtCell(2, 2);
    await expect(grid.editor).toBeVisible();

    await grid.hideEditor();

    await expect(grid.editor).toBeHidden();
    expect(await grid.commentMeta(2, 2)).toBeUndefined();
  });

  test('stores an empty comment when the focused empty editor is left', async() => {
    await grid.showAtCell(2, 2);
    await grid.textarea.focus();
    await expect(grid.textarea).toBeFocused();

    await grid.textarea.blur();

    // The blur saves the editor's text, so the cell now carries a comment with an empty value.
    await expect.poll(() => grid.commentMeta(2, 2)).toEqual({ value: '' });
    expect(await grid.storedComment(2, 2)).toBe('');
  });

  test('shows the stored text for a cell that has a comment', async() => {
    const stored = await grid.storedComment(1, 1);

    expect(stored).toBeTruthy();
    expect(await grid.showAtCell(1, 1)).toBe(true);

    await expect(grid.editor).toBeVisible();
    await expect(grid.textarea).toHaveValue(stored!);
  });

  test('returns false for a cell outside the grid', async() => {
    expect(await grid.showAtCell(500, 500)).toBe(false);
  });
});
