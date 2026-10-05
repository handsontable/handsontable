import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

/**
 * A merge that the MergeCells plugin refuses, because it overlaps a merge it does not contain, changes
 * nothing. So it must not leave an undo step, the merge flags in the cell meta, or a
 * `beforeMergeCells` call behind.
 */
test.describe('undo of a refused merge', () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid({ mergeCells: true, contextMenu: true });
  });

  // DEV-159: the refused merge of rows 2-3 over B1:D5 took an undo step of its own, so undoing the
  // two merges took three undos.
  test('a merge of row headers refused by an overlap takes no undo step', async () => {
    await grid.mergeWithShortcut([0, 1, 4, 3]);
    await expect.poll(() => grid.merges()).toEqual([[0, 1, 5, 3]]);
    await grid.trackMergeHooks();

    await grid.selectRowHeaders(1, 2);
    await grid.pressMergeShortcut();

    expect(await grid.merges()).toEqual([[0, 1, 5, 3]]);
    expect(await grid.undoStackSize()).toBe(1);
    expect(await grid.mergeHookCalls()).toEqual({ before: 0, after: 0 });
    // Only the cells B1:D5 covers keep their flags: the refused merge flags none of A2:G3.
    expect(await grid.cellsWithMergeMeta([1, 0, 2, 6])).toEqual(['1,1', '1,2', '1,3', '2,1', '2,2', '2,3']);

    await grid.mergeWithShortcut([1, 5, 2, 6]);
    await expect.poll(() => grid.merges()).toEqual([[0, 1, 5, 3], [1, 5, 2, 2]]);

    await grid.undo();
    expect(await grid.merges()).toEqual([[0, 1, 5, 3]]);

    await grid.undo();
    expect(await grid.merges()).toEqual([]);
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('a merge of row headers from the context menu refused by an overlap takes no undo step', async () => {
    await grid.mergeWithShortcut([0, 1, 4, 3]);
    await expect.poll(() => grid.merges()).toEqual([[0, 1, 5, 3]]);

    await grid.selectRowHeaders(1, 2);
    await grid.mergeRowsWithContextMenu(2);

    expect(await grid.merges()).toEqual([[0, 1, 5, 3]]);
    expect(await grid.undoStackSize()).toBe(1);
    expect(await grid.cellsWithMergeMeta([1, 0, 2, 6])).toEqual(['1,1', '1,2', '1,3', '2,1', '2,2', '2,3']);
  });

  test('a merge through the API refused by an overlap takes no undo step', async () => {
    await grid.mergeWithApi([0, 1, 4, 3]);
    await grid.trackMergeHooks();

    await grid.mergeWithApi([1, 0, 2, 6]);

    expect(await grid.merges()).toEqual([[0, 1, 5, 3]]);
    expect(await grid.undoStackSize()).toBe(1);
    expect(await grid.mergeHookCalls()).toEqual({ before: 0, after: 0 });
    expect(await grid.cellsWithMergeMeta([1, 0, 2, 6])).toEqual(['1,1', '1,2', '1,3', '2,1', '2,2', '2,3']);
  });

  // Control: a cell selection that overlaps a merge grows to cover it, so its merge is not refused.
  test('a cell selection that partly overlaps a merge still merges as one undo step', async () => {
    await grid.mergeWithShortcut([1, 1, 2, 2]);
    await grid.mergeWithShortcut([0, 4, 4, 5]);
    await expect.poll(() => grid.merges()).toEqual([[0, 4, 5, 2], [1, 1, 2, 2]]);
    await grid.trackMergeHooks();

    await grid.mergeWithShortcut([1, 1, 2, 4]);

    await expect.poll(() => grid.merges()).toEqual([[0, 1, 5, 5]]);
    expect(await grid.mergeHookCalls()).toEqual({ before: 1, after: 1 });
    expect(await grid.undoStackSize()).toBe(3);

    await grid.undo();
    expect(await grid.merges()).toEqual([[0, 4, 5, 2], [1, 1, 2, 2]]);
  });
});
