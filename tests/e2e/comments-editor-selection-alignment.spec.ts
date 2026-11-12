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

  test('puts the top edge of the editor on the top edge of the selection border in the row under the column headers', async() => {
    // The border of such a cell is drawn on the cell's own top edge, so there is nothing to reach.
    await expect.poll(async() => {
      const { editor, border } = await grid.selectionAlignment(0, 3);

      return Math.abs(editor.top - border.top);
    }).toBeLessThan(0.5);
  });

  test('puts the top edge of the editor on the top edge of the selection border in the row under a frozen row', async() => {
    await grid.freezeTopRows(3);

    await expect.poll(async() => {
      const { editor, border } = await grid.selectionAlignment(3, 4);

      return Math.abs(editor.top - border.top);
    }).toBeLessThan(0.5);
  });

  test('keeps the editor on the top edge of its cell when nothing is selected', async() => {
    // A comment opened by a hover has no selection border to reach.
    await grid.showEditorWithoutSelection(4, 4);

    await expect.poll(async() => {
      const { editor, cell } = await grid.verticalExtents(4, 4);

      return Math.abs(editor.top - cell.top);
    }).toBeLessThan(0.5);
  });

  test('keeps the editor on the top edge of its cell when the selection border belongs to another cell', async() => {
    await grid.selectCellAndShowEditorAt({ row: 4, col: 3 }, { row: 4, col: 4 });

    await expect.poll(async() => {
      const { editor, cell } = await grid.verticalExtents(4, 4);

      return Math.abs(editor.top - cell.top);
    }).toBeLessThan(0.5);
  });

  test('keeps the editor on the top edge of the cell it is anchored to in a hidden column', async() => {
    // The editor of a comment in a hidden column sits on the cell before it, which is the selected one,
    // but the border drawn there does not belong to the comment.
    await grid.selectCellAndShowEditorAt({ row: 6, col: 5 }, { row: 6, col: 6 });

    await expect.poll(async() => {
      const { editor, cell } = await grid.verticalExtents(6, 5);

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
