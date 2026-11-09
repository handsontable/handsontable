import { test, expect, THEMES_TAG } from '../fixtures/test';
import { CommentsMergedEditorSizePage } from '../fixtures/pages/CommentsMergedEditorSizePage';

/**
 * The comment editor opens next to the cell it belongs to. The selection border of that cell is drawn
 * one pixel outside the cell box, so an editor anchored at the cell's own top left sat one pixel below
 * the border's top edge. The design has the editor's top edge flush with the border's top edge, and its
 * start border on the border's end edge.
 */
test.describe('Comment editor - alignment with the cell selection border', { tag: THEMES_TAG }, () => {
  let grid: CommentsMergedEditorSizePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CommentsMergedEditorSizePage(page, theme, bundle);
    await grid.goto();
  });

  test('puts the top edge of the editor on the top edge of the selection border', async() => {
    await expect.poll(async() => {
      const { editor, border } = await grid.selectionAlignment(4, 4);

      return Math.abs(editor.top - border.top);
    }).toBeLessThan(0.5);
  });

  test('puts the top edge of the editor on the top edge of the selection border in a scrolled window', async() => {
    await grid.scrollWindowToCellTop(4, 4, 60);

    await expect.poll(async() => {
      const { editor, border } = await grid.selectionAlignment(4, 4);

      return Math.abs(editor.top - border.top);
    }).toBeLessThan(0.5);
  });

  test('keeps the editor on the top edge of its cell when the cell sits on the top edge of the window', async() => {
    // The selection border of such a cell is drawn above the window, so there is no room to reach it. The
    // editor stays on the cell instead of being moved a margin down by the viewport clamp.
    await grid.scrollWindowToCellTop(4, 4, 0);

    await expect.poll(async() => {
      const { editor, cell } = await grid.selectionAlignment(4, 4);

      return Math.abs(editor.top - cell.top);
    }).toBeLessThan(0.5);
  });

  test('keeps the start border of the editor on the end edge of the selection border', async() => {
    await expect.poll(async() => {
      const { editor, border } = await grid.selectionAlignment(4, 4);

      return Math.abs(editor.left - (border.right - editor.borderStart));
    }).toBeLessThan(0.5);
  });
});
