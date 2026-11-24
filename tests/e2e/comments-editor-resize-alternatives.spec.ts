import { test, expect, THEMES_TAG } from '../fixtures/test';
import { CommentsEditorResizePage } from '../fixtures/pages/CommentsEditorResizePage';

/**
 * Resizing the comment editor without dragging its grip: a resize mode on the keyboard (`Ctrl`/`Cmd`+`Alt`+`R`, the arrow
 * keys, `Enter`, `Escape`) and "click the grip, then click where the corner goes".
 */
test.describe('Comment editor resizing without a drag', { tag: THEMES_TAG }, () => {
  let grid: CommentsEditorResizePage;

  const politeText = () => grid.page.locator('[role="status"][aria-live="polite"]');
  const size = async () => {
    const box = await grid.textarea.boundingBox();

    return { width: Math.round(box!.width), height: Math.round(box!.height) };
  };

  /**
   * Opens the editor of the commented cell with the keyboard, which also focuses it.
   */
  async function openEditorWithKeyboard() {
    await grid.cell(1, 1).click();
    await grid.page.keyboard.press('Control+Alt+m');
    await expect(grid.textarea).toBeFocused();
  }

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new CommentsEditorResizePage(page, theme, bundle);
    await grid.goto();
  });

  test('arrow keys change the size of the focused editor, and Enter keeps it without closing the editor', async () => {
    await openEditorWithKeyboard();
    const start = await size();

    await grid.page.keyboard.press('ControlOrMeta+Alt+r');

    await expect(politeText()).toContainText('Resizing the comment box');

    await grid.page.keyboard.press('ArrowRight');
    await grid.page.keyboard.press('ArrowRight');
    await grid.page.keyboard.press('ArrowDown');
    await grid.page.keyboard.press('Shift+ArrowDown');

    await expect(politeText()).toHaveText(`Width: ${start.width + 20} pixels, Height: ${start.height + 11} pixels`);

    await grid.page.keyboard.press('Enter');

    expect(await size()).toEqual({ width: start.width + 20, height: start.height + 11 });
    await expect(grid.textarea).toBeFocused();
    // Enter ended the resize, it did not add a line to the comment
    expect(await grid.editorValue()).not.toContain('\n');
  });

  test('Escape puts the old size back, and the editor stays open', async () => {
    await openEditorWithKeyboard();
    const start = await size();

    await grid.page.keyboard.press('ControlOrMeta+Alt+r');
    await grid.page.keyboard.press('ArrowRight');
    await grid.page.keyboard.press('ArrowDown');
    await grid.page.keyboard.press('Escape');

    await expect(politeText()).toHaveText('Canceled.');
    expect(await size()).toEqual(start);
    await expect(grid.textarea).toBeVisible();
  });

  test('the arrow keys move the caret again once the resize ended', async () => {
    await openEditorWithKeyboard();
    await grid.page.keyboard.type('abc');
    await grid.page.keyboard.press('ControlOrMeta+Alt+r');
    await grid.page.keyboard.press('Enter');
    await grid.page.keyboard.press('ArrowLeft');
    await grid.page.keyboard.type('X');

    expect(await grid.editorValue()).toContain('abXc');
  });

  test('the size is saved to the comment like the size of a drag', async () => {
    await openEditorWithKeyboard();
    const start = await size();

    await grid.page.keyboard.press('ControlOrMeta+Alt+r');
    await grid.page.keyboard.press('ArrowRight');
    await grid.page.keyboard.press('Enter');

    await expect.poll(async () => (await grid.commentStyle(1, 1))?.width).toBe(start.width + 10);
  });

  test('a click on the grip, then a click on the grid, puts the corner of the editor there', async () => {
    await grid.showAtCell(1, 1);
    await expect(grid.textarea).toBeVisible();
    const box = await grid.textarea.boundingBox();
    const target = await grid.cellPoint(3, 0);

    // a press and a release on the grip with no movement is a click
    await grid.page.mouse.move(box!.x + box!.width - 4, box!.y + box!.height - 4);
    await grid.page.mouse.down();
    await grid.page.mouse.up();

    await expect(politeText()).toHaveText('Click or tap the target to finish. Press Escape to cancel.');

    // the pick has to land on the grid, so the corner goes to a point of it that is past the old corner
    const gridBox = await grid.grid.boundingBox();
    const pickX = Math.min(box!.x + box!.width + 40, gridBox!.x + gridBox!.width - 10);
    const pickY = Math.min(box!.y + box!.height + 40, gridBox!.y + gridBox!.height - 10);

    expect(pickX).toBeGreaterThan(box!.x + box!.width + 5);
    expect(pickY).toBeGreaterThan(box!.y + box!.height + 5);

    await grid.page.mouse.move(target.x, target.y);
    await grid.page.mouse.click(pickX, pickY);

    await expect.poll(size).toEqual({ width: Math.round(pickX - box!.x), height: Math.round(pickY - box!.y) });
  });
});
