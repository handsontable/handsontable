import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

const OVERLAP_WARNING = 'overlaps with the other declared merged cell';

/**
 * A merge that the MergeCells plugin refuses, because it overlaps a merge it does not contain, changes
 * nothing. So it must not leave an undo step, clear the redo history, dissolve a merge, leave the merge
 * flags in the cell meta, or fire `beforeMergeCells`. Each refusal still logs the one overlap warning,
 * which proves the merge was attempted.
 */
test.describe('undo of a refused merge', () => {
  let grid: UndoGridPage;
  let warnings: string[];

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    warnings = grid.collectWarnings();
    await grid.goto();
    await grid.initGrid({ mergeCells: true, contextMenu: true });
  });

  const overlapWarnings = () => warnings.filter(text => text.includes(OVERLAP_WARNING)).length;

  // DEV-159: the refused merge of rows 2-3 over B1:D5 took an undo step of its own, so undoing the
  // two merges took three undos.
  test('a merge of row headers refused by an overlap takes no undo step', async () => {
    await grid.mergeWithShortcut([0, 1, 4, 3]);
    await expect.poll(() => grid.merges()).toEqual([[0, 1, 5, 3]]);
    await grid.trackMergeHooks();

    await grid.selectRowHeaders(1, 2);
    await grid.pressMergeShortcut();

    await expect.poll(overlapWarnings).toBe(1);
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
    await grid.trackMergeHooks();

    await grid.selectRowHeaders(1, 2);
    await grid.mergeRowsWithContextMenu(2);

    await expect.poll(overlapWarnings).toBe(1);
    expect(await grid.merges()).toEqual([[0, 1, 5, 3]]);
    expect(await grid.undoStackSize()).toBe(1);
    expect(await grid.mergeHookCalls()).toEqual({ before: 0, after: 0 });
    expect(await grid.cellsWithMergeMeta([1, 0, 2, 6])).toEqual(['1,1', '1,2', '1,3', '2,1', '2,2', '2,3']);
  });

  test('a merge through the API refused by an overlap takes no undo step', async () => {
    await grid.mergeWithApi([0, 1, 4, 3]);
    await grid.trackMergeHooks();

    await grid.mergeWithApi([1, 0, 2, 6]);

    await expect.poll(overlapWarnings).toBe(1);
    expect(await grid.merges()).toEqual([[0, 1, 5, 3]]);
    expect(await grid.undoStackSize()).toBe(1);
    expect(await grid.mergeHookCalls()).toEqual({ before: 0, after: 0 });
    expect(await grid.cellsWithMergeMeta([1, 0, 2, 6])).toEqual(['1,1', '1,2', '1,3', '2,1', '2,2', '2,3']);
  });

  // The selection merge unmerges the merges inside the range before it merges. Refused, it must not
  // have dissolved F2:G3, which lies inside rows 2-3.
  test('a refused merge of row headers keeps the merges inside the selection', async () => {
    await grid.mergeWithShortcut([0, 1, 4, 3]);
    await grid.mergeWithShortcut([1, 5, 2, 6]);
    await expect.poll(() => grid.merges()).toEqual([[0, 1, 5, 3], [1, 5, 2, 2]]);
    await grid.trackMergeHooks();

    await grid.selectRowHeaders(1, 2);
    await grid.pressMergeShortcut();

    await expect.poll(overlapWarnings).toBe(1);
    expect(await grid.merges()).toEqual([[0, 1, 5, 3], [1, 5, 2, 2]]);
    expect(await grid.undoStackSize()).toBe(2);
    expect(await grid.mergeHookCalls()).toEqual({ before: 0, after: 0 });
    expect(await grid.cellsWithMergeMeta([1, 0, 2, 6]))
      .toEqual(['1,1', '1,2', '1,3', '1,5', '1,6', '2,1', '2,2', '2,3', '2,5', '2,6']);
  });

  test('a refused merge keeps the redo history', async () => {
    await grid.mergeWithShortcut([0, 1, 4, 3]);
    await grid.mergeWithShortcut([1, 5, 2, 6]);
    await expect.poll(() => grid.merges()).toEqual([[0, 1, 5, 3], [1, 5, 2, 2]]);

    await grid.undo();
    expect(await grid.merges()).toEqual([[0, 1, 5, 3]]);

    await grid.selectRowHeaders(1, 2);
    await grid.pressMergeShortcut();

    await expect.poll(overlapWarnings).toBe(1);
    expect(await grid.isRedoAvailable()).toBe(true);

    await grid.redo();
    expect(await grid.merges()).toEqual([[0, 1, 5, 3], [1, 5, 2, 2]]);
  });

  // A merge whose rows are all trimmed keeps stale coordinates. The cells there show other records,
  // and a merge of them is not an overlap.
  test('a merge over the rows of a merge whose rows are all trimmed is not refused', async () => {
    await grid.initGrid({ mergeCells: true, trimRows: true });
    await grid.mergeWithApi([1, 1, 2, 2]);
    await grid.trimRows([1, 2]);

    await grid.mergeWithApi([1, 1, 2, 2]);

    expect(overlapWarnings()).toBe(0);
    expect(await grid.merges()).toEqual([[1, 1, 2, 2], [1, 1, 2, 2]]);
    expect(await grid.cellsWithMergeMeta([1, 1, 2, 2])).toEqual(['1,1', '1,2', '2,1', '2,2']);
  });

  // The check runs before `beforeMergeCells`, so a listener of it can still add a merge over the range.
  // `add()` then refuses this merge, and the flags written for it must not stay on the cells.
  test('a merge refused after a `beforeMergeCells` listener merged over it leaves no flags behind', async () => {
    await grid.mergeOnceFromBeforeMergeCells([0, 0, 1, 1]);

    await grid.mergeWithApi([1, 0, 2, 2]);

    await expect.poll(overlapWarnings).toBe(1);
    expect(await grid.merges()).toEqual([[0, 0, 2, 2]]);
    expect(await grid.cellsWithMergeMeta([0, 0, 2, 2])).toEqual(['0,0', '0,1', '1,0', '1,1']);
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
