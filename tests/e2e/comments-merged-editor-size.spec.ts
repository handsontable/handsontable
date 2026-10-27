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

  test('keeps a size the user saved', async() => {
    await grid.showEditorAt(6, 4);

    await expect.poll(async() => (await grid.heights(6, 4)).editor).toBe(140);
  });
});
