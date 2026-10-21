import { test, expect } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

/**
 * Undo and redo of plugin actions: hiding, trimming, freezing, resizing, collapsing, borders,
 * comments and pages. Each action is one undo step, and an undo restores the plugin's state from
 * the step's snapshot (and the cell meta from the step's journal).
 *
 * The fixture's data is `<column letter><row number>` over a 6x7 grid, so cell (0, 0) reads `A1`.
 */
test.describe('undo of plugin state', () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('hiding rows is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ hiddenRows: true });
    await grid.hideRows([1, 2]);

    expect(await grid.isRowHidden(1)).toBe(true);
    expect(await grid.isRowHidden(2)).toBe(true);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.isRowHidden(1)).toBe(false);
    expect(await grid.isRowHidden(2)).toBe(false);

    await grid.redo();

    expect(await grid.isRowHidden(1)).toBe(true);
    expect(await grid.isRowHidden(2)).toBe(true);
  });

  test('showing hidden rows is one step that an undo reverts', async () => {
    await grid.initGrid({ hiddenRows: { rows: [1, 2] } });
    await grid.showRows([1]);

    expect(await grid.isRowHidden(1)).toBe(false);
    expect(await grid.isRowHidden(2)).toBe(true);

    await grid.undo();

    expect(await grid.isRowHidden(1)).toBe(true);
    expect(await grid.isRowHidden(2)).toBe(true);
  });

  test('trimming rows is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ trimRows: true });
    await grid.trimRows([0, 3]);

    expect(await grid.columnValues(0)).toEqual(['A2', 'A3', 'A5', 'A6']);

    await grid.undo();

    expect(await grid.columnValues(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);

    await grid.redo();

    expect(await grid.columnValues(0)).toEqual(['A2', 'A3', 'A5', 'A6']);
  });

  test('freezing a column is one step that an undo reverts, the column order included', async () => {
    await grid.initGrid({ manualColumnFreeze: true });
    await grid.freezeColumn(3);

    expect(await grid.frozenColumnCount()).toBe(1);
    expect(await grid.rowValues(0)).toEqual(['D1', 'A1', 'B1', 'C1', 'E1', 'F1', 'G1']);

    await grid.undo();

    expect(await grid.frozenColumnCount()).toBe(0);
    expect(await grid.rowValues(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1']);

    await grid.redo();

    expect(await grid.frozenColumnCount()).toBe(1);
    expect(await grid.rowValues(0)).toEqual(['D1', 'A1', 'B1', 'C1', 'E1', 'F1', 'G1']);
  });

  test('an undo of an edit made after a hide leaves the rows hidden', async () => {
    await grid.initGrid({ hiddenRows: true });
    await grid.hideRows([1]);
    await grid.setCell(0, 0, 'edited');

    await grid.undo();

    // Only the edit is undone; the hide is a step of its own.
    expect(await grid.rowValues(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1']);
    expect(await grid.isRowHidden(1)).toBe(true);
  });

  test('a column resize through the API is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ manualColumnResize: true });
    const initialWidth = await grid.columnWidth(1);

    await grid.resizeColumn(1, 150);

    expect(await grid.columnWidth(1)).toBe(150);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.columnWidth(1)).toBe(initialWidth);

    await grid.redo();

    expect(await grid.columnWidth(1)).toBe(150);
  });

  test('dragging a column resize handle is one step, however many moves the drag takes', async () => {
    await grid.initGrid({ manualColumnResize: true });
    const initialWidth = await grid.columnWidth(1);

    await grid.dragColumnResizeHandle(1, 60);

    const draggedWidth = await grid.columnWidth(1);

    expect(draggedWidth).toBeGreaterThan(initialWidth);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.columnWidth(1)).toBe(initialWidth);

    await grid.redo();

    expect(await grid.columnWidth(1)).toBe(draggedWidth);
  });

  test('an edit made while a column resize is dragged is a step of its own, and undoing it leaves the width', async () => {
    await grid.initGrid({ manualColumnResize: true });
    const initialWidth = await grid.columnWidth(1);

    await grid.dragColumnResizeHandleWhile(1, 60, () => grid.setCell(0, 0, 'edited'));

    expect(await grid.columnWidth(1)).toBeGreaterThan(initialWidth);
    expect(await grid.undoStackSize()).toBe(2);

    // The resize settled last, so it is undone first - back to the width before the drag, not to
    // the width the drag had reached when the edit settled.
    await grid.undo();

    expect(await grid.columnWidth(1)).toBe(initialWidth);
    expect(await grid.cellValue(0, 0)).toBe('edited');

    await grid.undo();

    expect(await grid.cellValue(0, 0)).toBe('A1');
    expect(await grid.columnWidth(1)).toBe(initialWidth);
  });

  // DEV-513: the double-click autosize is a resize a user makes, so it is undoable like a drag.
  test('autosizing a column by double-clicking its resize handle is one step that an undo reverts', async () => {
    await grid.initGrid({
      data: [['a', 'a value much longer than the column is wide', 'c']],
      manualColumnResize: [50, 50, 50],
    });
    const initialWidth = await grid.columnWidth(1);

    await grid.doubleClickColumnResizeHandle(1);
    await expect.poll(() => grid.columnWidth(1)).toBeGreaterThan(initialWidth);

    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.columnWidth(1)).toBe(initialWidth);
  });

  // DEV-2806 listed a row resize among the actions undo did not cover.
  test('a row resize through the API is one step that an undo reverts', async () => {
    await grid.initGrid({ manualRowResize: true });
    const initialHeight = await grid.rowHeight(1);

    await grid.resizeRow(1, 80);

    expect(await grid.rowHeight(1)).toBe(80);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.rowHeight(1)).toBe(initialHeight);
  });

  test('collapsing a header group is one step, and an undo expands it and its button again', async () => {
    await grid.initGrid({
      nestedHeaders: [
        [{ label: 'Group', colspan: 3 }, 'D', 'E', 'F', 'G'],
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      ],
      collapsibleColumns: true,
    });
    await grid.collapseHeaderGroup(-2, 0);

    expect(await grid.renderableColumnCount()).toBe(5);
    await expect(grid.collapseButtons().first()).toHaveClass(/\bcollapsed\b/);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.renderableColumnCount()).toBe(7);
    await expect(grid.collapseButtons().first()).toHaveClass(/\bexpanded\b/);

    await grid.redo();

    expect(await grid.renderableColumnCount()).toBe(5);
    await expect(grid.collapseButtons().first()).toHaveClass(/\bcollapsed\b/);
  });

  test('collapsing a nested-rows parent is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({
      data: [
        { name: 'P1', __children: [{ name: 'P1-1' }, { name: 'P1-2' }] },
        { name: 'P2', __children: [{ name: 'P2-1' }] },
      ],
      columns: [{ data: 'name' }],
      nestedRows: true,
    });
    await grid.collapseParentRow(0);

    expect(await grid.rowCount()).toBe(3);
    expect(await grid.isParentRowCollapsed(0)).toBe(true);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.rowCount()).toBe(5);
    expect(await grid.isParentRowCollapsed(0)).toBe(false);

    await grid.redo();

    expect(await grid.rowCount()).toBe(3);
    expect(await grid.isParentRowCollapsed(0)).toBe(true);
  });

  test('adding a custom border is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ customBorders: true });
    await grid.setTopBorder([1, 1, 2, 2]);

    const borderCount = await grid.borderCount();

    expect(borderCount).toBeGreaterThan(0);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.borderCount()).toBe(0);

    await grid.redo();

    expect(await grid.borderCount()).toBe(borderCount);
  });

  test('a redo rebuilds the borders without writing their cell meta again', async () => {
    await grid.initGrid({ customBorders: true });
    await grid.setTopBorder([1, 1, 2, 2]);

    const borderCount = await grid.borderCount();

    await grid.undo();
    // A listener that vetoes border meta writes, the way an app locks cells. The redo restores the
    // meta from its journal, so the plugin must rebuild its model without writing the meta again -
    // a write would be vetoed and the border dropped.
    await grid.vetoMetaWrites('borders');
    await grid.redo();

    expect(await grid.metaWriteAttempts()).toBe(0);
    expect(await grid.borderCount()).toBe(borderCount);
  });

  test('setting a comment is one step, and an undo removes its cell marker', async () => {
    await grid.initGrid({ comments: true });
    await grid.setComment(1, 1, 'Check this');

    await expect(grid.cell(1, 1)).toHaveClass(/\bhtCommentCell\b/);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.comment(1, 1)).toBeUndefined();
    await expect(grid.cell(1, 1)).not.toHaveClass(/\bhtCommentCell\b/);

    await grid.redo();

    expect(await grid.comment(1, 1)).toBe('Check this');
    await expect(grid.cell(1, 1)).toHaveClass(/\bhtCommentCell\b/);
  });

  test('leaving the comment editor records a step only when the text changed', async ({ page }) => {
    await grid.initGrid({ comments: true });
    await grid.setComment(0, 0, 'First');
    await grid.openCommentEditor(0, 0);

    // Leave without typing: the save writes the same text and adds no step.
    await grid.cell(4, 5).click();

    expect(await grid.undoStackSize()).toBe(1);

    // Positive control: typing, then leaving, is one step.
    await grid.openCommentEditor(0, 0);
    await page.keyboard.type(' and more');
    await grid.cell(4, 5).click();

    expect(await grid.comment(0, 0)).toBe('First and more');
    expect(await grid.undoStackSize()).toBe(2);

    await grid.undo();

    expect(await grid.comment(0, 0)).toBe('First');
  });

  test('an undo that removes the comment under the open editor closes the editor without saving', async () => {
    await grid.initGrid({ comments: true });
    await grid.setComment(0, 0, 'Check this');
    await grid.openCommentEditor(0, 0);

    await grid.undo();

    await expect(grid.commentTextArea()).toBeHidden();

    // Leaving the editor's cell must not write an empty comment back.
    await grid.cell(4, 5).click();

    expect(await grid.commentMeta(0, 0)).toBeUndefined();
    await expect(grid.cell(0, 0)).not.toHaveClass(/\bhtCommentCell\b/);

    await grid.redo();

    expect(await grid.comment(0, 0)).toBe('Check this');
  });

  // The API undo does not blur the editor (a timer can call it), and the step it undoes did not touch
  // the comment being typed, so the editor stays as it was.
  test('an undo of another step leaves an editor adding a new comment open, with its text', async ({ page }) => {
    await grid.initGrid({ comments: true });

    const original = await grid.cellValue(3, 3);

    await grid.setCell(3, 3, 'Edited');
    await grid.openCommentEditor(0, 0);
    await page.keyboard.type('Draft');
    await grid.undo();

    expect(await grid.cellValue(3, 3)).toBe(original);
    await expect(grid.commentTextArea()).toBeVisible();
    await expect(grid.commentTextArea()).toHaveValue('Draft');
  });

  test('changing the page is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ pagination: { pageSize: 2 } });
    await grid.setPage(2);

    expect(await grid.currentPage()).toBe(2);
    await expect(grid.cell(2, 0)).toBeVisible();
    await expect(grid.cell(0, 0)).toHaveCount(0);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.currentPage()).toBe(1);
    await expect(grid.cell(0, 0)).toBeVisible();
    await expect(grid.cell(2, 0)).toHaveCount(0);

    await grid.redo();

    expect(await grid.currentPage()).toBe(2);
    await expect(grid.cell(2, 0)).toBeVisible();
  });

  // A merge over existing merges first unmerges them. That is part of the same user action, so one
  // undo brings the replaced merges back (DEV-160, DEV-514).
  test('merging over existing merges is one step that one undo reverts', async () => {
    await grid.initGrid({ mergeCells: true });
    await grid.mergeWithShortcut([0, 1, 2, 1]);
    await grid.mergeWithShortcut([0, 3, 2, 3]);

    const rowBefore = await grid.rowValues(0);

    await grid.mergeWithShortcut([0, 0, 2, 3]);

    expect(await grid.merges()).toEqual([[0, 0, 3, 4]]);
    expect(await grid.undoStackSize()).toBe(3);

    await grid.undoWithKeyboard();

    expect(await grid.merges()).toEqual([[0, 1, 3, 1], [0, 3, 3, 1]]);
    expect(await grid.rowValues(0)).toEqual(rowBefore);
  });
});
