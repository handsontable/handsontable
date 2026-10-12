import { test, expect } from '../fixtures/test';
import { CommentsEditorPositionPage } from '../fixtures/pages/CommentsEditorPositionPage';

/**
 * DEV-3207. On an RTL page the window has scrolled, the comment editor of a cell near the
 * viewport's LEFT edge covered the cell instead of flipping to the cell's right side.
 *
 * The flip threshold compared the editor's position with the document's leftmost x. That only
 * equals the viewport's left edge when the page is scrolled all the way to its inline end, so each
 * test scrolls only PART of the way (and asserts it did) - the position where the unfixed code
 * misses the flip and `clampPositionToViewport` pulls the editor back onto the cell.
 */
test.describe('Comment editor position - RTL page scrolled by the window', () => {
  let grid: CommentsEditorPositionPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new CommentsEditorPositionPage(page, theme, bundle);
    await grid.goto();
  });

  test('flips to the cell right side when the cell is near the viewport left edge', async () => {
    await grid.scrollCellToViewportLeft(1, 33, 30);
    expect(await grid.isScrolledPartOfTheWay()).toBe(true);

    await grid.showEditorAt(1, 33);

    const cell = (await grid.cell(1, 33).boundingBox())!;
    const editor = (await grid.editor.boundingBox())!;

    // Flipped and adjacent: the editor starts where the cell ends, so it does not cover it.
    expect(editor.x).toBeGreaterThanOrEqual(cell.x + cell.width - 1);
    expect(editor.x).toBeLessThanOrEqual(cell.x + cell.width + 2);
  });

  test('keeps the editor on the cell left side when it fits inside the viewport', async () => {
    await grid.scrollCellToViewportLeft(1, 33, 400);
    expect(await grid.isScrolledPartOfTheWay()).toBe(true);

    await grid.showEditorAt(1, 33);

    const cell = (await grid.cell(1, 33).boundingBox())!;
    const editor = (await grid.editor.boundingBox())!;

    expect(editor.x + editor.width).toBeLessThanOrEqual(cell.x + 1);
    expect(editor.x).toBeGreaterThanOrEqual(0);
  });
});
