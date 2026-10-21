import { test, expect, CROSS_BROWSER_TAG, THEMES_TAG } from '../fixtures/test';
import { CommentsEditorPositionPage } from '../fixtures/pages/CommentsEditorPositionPage';

/**
 * DEV-3207. The comment editor of a cell near the viewport's LEFT edge covered the cell instead of
 * flipping to the cell's right side, whenever the window scrolled the grid.
 *
 * The flip threshold compared the editor's position with the document's leftmost x. That only
 * equals the viewport's left edge when an RTL page is scrolled all the way to its inline end. The
 * tests cover the other scroll states, so a later change back to a document-based or sign-based
 * check turns one of them red: an RTL page scrolled PART of the way, an RTL page that overflows but
 * is not scrolled yet (`scrollX` 0), and an RTL grid on an LTR page (positive `scrollX`).
 */
test.describe('Comment editor position - RTL grid scrolled by the window', { tag: [CROSS_BROWSER_TAG, THEMES_TAG] }, () => {
  test.describe('on an RTL page', () => {
    let grid: CommentsEditorPositionPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new CommentsEditorPositionPage(page, theme, bundle, 'rtl');
      await grid.goto();
    });

    test('flips to the cell right side when the page is scrolled part of the way', async() => {
      await grid.scrollCellToViewportLeft(1, 33, 30);

      const { scrollX, max } = await grid.scrollState();

      expect(scrollX).toBeLessThan(0);
      expect(scrollX).toBeGreaterThan(-max);

      await grid.showEditorAt(1, 33);

      const cell = (await grid.cell(1, 33).boundingBox())!;
      const editor = (await grid.editor.boundingBox())!;

      // Flipped and adjacent: the editor starts where the cell ends, so it does not cover it.
      expect(editor.x).toBeGreaterThanOrEqual(cell.x + cell.width - 1);
      expect(editor.x).toBeLessThanOrEqual(cell.x + cell.width + 2);
    });

    test('flips to the cell right side when the page overflows but is not scrolled yet', async() => {
      await grid.scrollToStart();

      const col = await grid.columnNearestViewportLeft(1);

      await grid.showEditorAt(1, col);

      const cell = (await grid.cell(1, col).boundingBox())!;
      const editor = (await grid.editor.boundingBox())!;

      expect(editor.x).toBeGreaterThanOrEqual(cell.x + cell.width - 1);
      expect(editor.x).toBeLessThanOrEqual(cell.x + cell.width + 2);
    });

    test('keeps the editor on the cell left side when it fits inside the viewport', async() => {
      await grid.scrollCellToViewportLeft(1, 33, 400);

      const { scrollX, max } = await grid.scrollState();

      expect(scrollX).toBeLessThan(0);
      expect(scrollX).toBeGreaterThan(-max);

      await grid.showEditorAt(1, 33);

      const cell = (await grid.cell(1, 33).boundingBox())!;
      const editor = (await grid.editor.boundingBox())!;

      expect(editor.x + editor.width).toBeLessThanOrEqual(cell.x + 1);
      expect(editor.x).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('on an LTR page', () => {
    test('flips to the cell right side when the page is scrolled part of the way', async({ page, theme, bundle }) => {
      const grid = new CommentsEditorPositionPage(page, theme, bundle, 'ltr');

      await grid.goto();
      await grid.scrollCellToViewportLeft(1, 33, 30);

      const { scrollX, max } = await grid.scrollState();

      expect(scrollX).toBeGreaterThan(0);
      expect(scrollX).toBeLessThan(max);

      await grid.showEditorAt(1, 33);

      const cell = (await grid.cell(1, 33).boundingBox())!;
      const editor = (await grid.editor.boundingBox())!;

      expect(editor.x).toBeGreaterThanOrEqual(cell.x + cell.width - 1);
      expect(editor.x).toBeLessThanOrEqual(cell.x + cell.width + 2);
    });
  });
});
