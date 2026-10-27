import { test, expect, THEMES_TAG } from '../fixtures/test';
import { CommentsMergedEditorSizePage } from '../fixtures/pages/CommentsMergedEditorSizePage';

/**
 * The comment editor of a merged range was a fixed 88px tall box, so it stuck out below a range
 * shorter than that and ended short of a taller one. Without a saved size, the box takes the height
 * of the range it belongs to. A size the user saved still wins, and a cell that spans a single row
 * keeps the default.
 */
test.describe('Comment editor size - merged ranges', { tag: THEMES_TAG }, () => {
  let grid: CommentsMergedEditorSizePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CommentsMergedEditorSizePage(page, theme, bundle);
    await grid.goto();
  });

  test('matches the height of a range five rows tall', async() => {
    await grid.showEditorAt(1, 1);

    await expect.poll(async() => {
      const { editor, cell } = await grid.heights(1, 1);

      return Math.abs(editor - cell);
    }).toBeLessThanOrEqual(1);
  });

  test('matches the height of a range two rows tall', async() => {
    await grid.showEditorAt(6, 1);

    await expect.poll(async() => {
      const { editor, cell } = await grid.heights(6, 1);

      return Math.abs(editor - cell);
    }).toBeLessThanOrEqual(1);
  });

  test('does not write the derived height to the cell meta', async() => {
    await grid.showEditorAt(6, 1);

    await expect.poll(async() => {
      const { editor, cell } = await grid.heights(6, 1);

      return Math.abs(editor - cell);
    }).toBeLessThanOrEqual(1);
    await grid.settleResizeObserver();
    expect(await grid.savedStyle(6, 1)).toBeUndefined();
  });

  test('keeps the default height for a plain cell and for a merge one row tall', async() => {
    await grid.showEditorAt(4, 4);

    const plain = (await grid.heights(4, 4)).editor;

    await grid.showEditorAt(5, 3);

    expect((await grid.heights(5, 3)).editor).toBe(plain);
  });

  test('gives the next plain cell the default height back after a merged one', async() => {
    await grid.showEditorAt(4, 4);

    const before = (await grid.heights(4, 4)).editor;

    await grid.showEditorAt(6, 1);
    await grid.showEditorAt(4, 4);

    expect((await grid.heights(4, 4)).editor).toBe(before);
  });

  test('takes the height of the whole range when a frozen row cuts it', async() => {
    await grid.freezeTopRows(3);
    await grid.showEditorAt(1, 1);

    await expect.poll(async() => {
      const { editor, cell } = await grid.heights(1, 1);

      return Math.abs(editor - cell);
    }).toBeLessThanOrEqual(1);
  });

  test('keeps the default height for a range that starts on a hidden row', async() => {
    await grid.showEditorAt(4, 4);

    const plain = (await grid.heights(4, 4)).editor;

    await grid.showEditorAt(2, 5);

    await expect.poll(async() => (await grid.heights(1, 5)).editor).toBe(plain);
  });

  test('keeps the default height for a range in a hidden column', async() => {
    await grid.showEditorAt(4, 4);

    const plain = (await grid.heights(4, 4)).editor;

    await grid.showEditorAt(6, 6);

    await expect.poll(async() => (await grid.heights(6, 5)).editor).toBe(plain);
  });

  test('keeps the default height when the rows of the range that remain visible are one', async() => {
    await grid.showEditorAt(4, 4);

    const plain = (await grid.heights(4, 4)).editor;

    await grid.showEditorAt(1, 0);

    await expect.poll(async() => (await grid.heights(1, 0)).editor).toBe(plain);
  });

  test('takes the height of a range that sits wholly in the frozen rows', async() => {
    await grid.freezeTopRows(3);
    await grid.showEditorAt(0, 3);

    await expect.poll(async() => {
      const { editor, cell } = await grid.heights(0, 3);

      return Math.abs(editor - cell);
    }).toBeLessThanOrEqual(1);
  });

  test('takes the height of a range in a frozen column that the grid has scrolled away from', async() => {
    await grid.freezeFirstColumnAndScrollAway();
    await grid.showEditorAt(3, 0);

    await expect.poll(async() => {
      const { editor, cell } = await grid.heights(3, 0);

      return Math.abs(editor - cell);
    }).toBeLessThanOrEqual(1);
  });

  test('does not carry the height of a merged range to a comment saved with a width only', async() => {
    await grid.showEditorAt(4, 4);

    const plain = (await grid.heights(4, 4)).editor;

    await grid.showEditorAt(6, 1);
    await grid.showEditorAt(3, 4);

    await expect.poll(async() => (await grid.heights(3, 4)).editor).toBe(plain);
  });

  test('ends a flipped box at the bottom of a range that a frozen row cuts', async({ page }) => {
    await grid.freezeTopRows(3);

    const { cell } = await grid.verticalExtents(1, 1);

    // A window that ends just above the range's bottom makes the box flip upward.
    await page.setViewportSize({ width: 1280, height: Math.floor(cell.bottom) - 4 });
    await grid.showEditorAt(1, 1);

    const after = await grid.verticalExtents(1, 1);

    // Flipped by the part of the box that sticks out below the range, not by the part of the range
    // the frozen rows cut off: that would lift the box clear of the range, over the rows above it.
    // The window's own margin keeps the box within about 15px of the range's top.
    await expect.poll(async() => (await grid.verticalExtents(1, 1)).editor.top)
      .toBeGreaterThan(after.cell.top - 30);
  });

  test('keeps a size the user saved', async() => {
    await grid.showEditorAt(6, 4);

    await expect.poll(async() => (await grid.heights(6, 4)).editor).toBe(140);
  });
});
