import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { UndoGridPage } from '../fixtures/pages/UndoGridPage';

/**
 * Undo and redo of plugin actions the user starts with a real gesture: a context menu entry, a pager
 * control, a resize drag. `undo-plugin-state.spec.ts` covers the undo step of each action through the
 * plugin API; this spec proves the gesture itself opens the operation, so the action lands on the undo
 * stack as one step and one undo reverts it.
 *
 * Each test pins the step count right after the gesture, which is the positive control: an undo that
 * reverts "nothing" would pass a test that never recorded the step.
 *
 * The fixture's data is `<column letter><row number>` over a 6x7 grid, so cell (0, 0) reads `A1`.
 */
test.describe('undo of a gesture', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('hiding a row through the context menu is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ contextMenu: true, hiddenRows: true });
    await grid.openContextMenuOnRowHeader(1);
    await grid.chooseContextMenuItem('Hide row');

    expect(await grid.isRowHidden(1)).toBe(true);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.isRowHidden(1)).toBe(false);

    await grid.redo();

    expect(await grid.isRowHidden(1)).toBe(true);
  });

  test('hiding a column through the context menu is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ contextMenu: true, hiddenColumns: true });
    await grid.openContextMenuOnColumnHeader(2);
    await grid.chooseContextMenuItem('Hide column');

    expect(await grid.isColumnHidden(2)).toBe(true);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.isColumnHidden(2)).toBe(false);

    await grid.redo();

    expect(await grid.isColumnHidden(2)).toBe(true);
  });

  test('freezing a column through the context menu is one step that an undo reverts, the column order included', async () => {
    await grid.initGrid({ contextMenu: true, manualColumnFreeze: true });
    await grid.openContextMenuOnCell(1, 3);
    await grid.chooseContextMenuItem('Freeze column');

    expect(await grid.frozenColumnCount()).toBe(1);
    expect(await grid.rowValues(0)).toEqual(['D1', 'A1', 'B1', 'C1', 'E1', 'F1', 'G1']);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.frozenColumnCount()).toBe(0);
    expect(await grid.rowValues(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1']);

    await grid.redo();

    expect(await grid.frozenColumnCount()).toBe(1);
    expect(await grid.rowValues(0)).toEqual(['D1', 'A1', 'B1', 'C1', 'E1', 'F1', 'G1']);
  });

  test('adding a border through the context menu is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ contextMenu: true, customBorders: true });
    await grid.openContextMenuOnCell(2, 2);
    await grid.chooseContextMenuSubmenuItem('Borders', 'Top');

    // The "Top" entry puts a top border on the clicked cell and no other side or cell.
    const topBorderOfCell = { row: 2, col: 2, top: { width: 1 }, bottom: { hide: true }, left: { hide: true }, right: { hide: true } };

    expect(await grid.borderCount()).toBe(1);
    expect(await grid.bordersOf(2, 2)).toMatchObject([topBorderOfCell]);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.borderCount()).toBe(0);

    await grid.redo();

    expect(await grid.borderCount()).toBe(1);
    expect(await grid.bordersOf(2, 2)).toMatchObject([topBorderOfCell]);
  });

  test('deleting a comment through the context menu is one step that an undo brings the comment back from', async () => {
    await grid.initGrid({ contextMenu: true, comments: true });
    await grid.setComment(1, 1, 'Check this');
    await grid.openContextMenuOnCell(1, 1);
    await grid.chooseContextMenuItem('Delete comment');

    expect(await grid.comment(1, 1)).toBeUndefined();
    await expect(grid.cell(1, 1)).not.toHaveClass(/\bhtCommentCell\b/);
    // The comment set through the API is the first step, the deletion the second.
    expect(await grid.undoStackSize()).toBe(2);

    await grid.undo();

    expect(await grid.comment(1, 1)).toBe('Check this');
    await expect(grid.cell(1, 1)).toHaveClass(/\bhtCommentCell\b/);

    await grid.redo();

    expect(await grid.comment(1, 1)).toBeUndefined();
  });

  test('a click on the pager\'s next button is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ pagination: { pageSize: 2 } });
    await grid.clickPagerButton('next');

    expect(await grid.currentPage()).toBe(2);
    await expect(grid.cell(2, 0)).toBeVisible();
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.currentPage()).toBe(1);
    await expect(grid.cell(0, 0)).toBeVisible();

    await grid.redo();

    expect(await grid.currentPage()).toBe(2);
    await expect(grid.cell(2, 0)).toBeVisible();
  });

  test('a pick in the pager\'s page-size select is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ pagination: { pageSize: 2 } });
    await grid.selectPageSize('5');

    expect(await grid.pageSize()).toBe(5);
    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.pageSize()).toBe(2);

    await grid.redo();

    expect(await grid.pageSize()).toBe(5);
  });

  test('dragging a row resize handle is one step that an undo reverts and a redo repeats', async () => {
    await grid.initGrid({ manualRowResize: true });

    const initialHeight = await grid.renderedRowHeight(1);

    await grid.dragRowResizeHandle(1, 40);

    // The row grows by the distance dragged, give or take a border.
    await expect.poll(() => grid.renderedRowHeight(1)).toBeGreaterThanOrEqual(initialHeight + 38);
    await expect.poll(() => grid.renderedRowHeight(1)).toBeLessThanOrEqual(initialHeight + 42);

    const draggedHeight = await grid.renderedRowHeight(1);

    expect(await grid.undoStackSize()).toBe(1);

    await grid.undo();

    await expect.poll(() => grid.renderedRowHeight(1)).toBe(initialHeight);

    await grid.redo();

    await expect.poll(() => grid.renderedRowHeight(1)).toBe(draggedHeight);
  });
});

/**
 * Adding a comment through the context menu needs the comment editor to keep the keyboard focus after
 * the menu closes, and WebKit moves the focus back to the cell there (Chromium keeps it in the editor).
 * So this block has no `CROSS_BROWSER_TAG` and runs on the Chromium legs only.
 */
test.describe('undo of a comment added through the context menu', () => {
  let grid: UndoGridPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new UndoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('adding a comment through the context menu is one step, recorded when the editor is left', async ({ page }) => {
    await grid.initGrid({ contextMenu: true, comments: true });
    await grid.openContextMenuOnCell(1, 1);
    await grid.chooseContextMenuItem('Add comment');
    await expect(grid.commentTextArea()).toBeFocused();
    await page.keyboard.type('Check this');

    // Nothing is recorded while the editor is open.
    expect(await grid.undoStackSize()).toBe(0);

    // The text is saved, and the step recorded, when the editor loses the focus. The cell clicked is the
    // last row's first one, clear of the editor, which opens to the right of cell (1, 1). The blur
    // handler writes the comment a frame later, so the state is polled.
    await grid.cell(5, 0).click();

    await expect(grid.cell(1, 1)).toHaveClass(/\bhtCommentCell\b/);
    await expect.poll(() => grid.comment(1, 1)).toBe('Check this');
    await expect.poll(() => grid.undoStackSize()).toBe(1);

    await grid.undo();

    expect(await grid.comment(1, 1)).toBeUndefined();
    await expect(grid.cell(1, 1)).not.toHaveClass(/\bhtCommentCell\b/);

    await grid.redo();

    expect(await grid.comment(1, 1)).toBe('Check this');
    await expect(grid.cell(1, 1)).toHaveClass(/\bhtCommentCell\b/);
  });
});
