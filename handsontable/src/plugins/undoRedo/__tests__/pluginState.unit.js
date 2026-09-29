import { Comments, HiddenColumns, registerPlugin, UndoRedo } from 'handsontable/plugins';
import { setUpUndoGrid, spreadsheet } from './helpers/grid';

registerPlugin(UndoRedo);
registerPlugin(Comments);
registerPlugin(HiddenColumns);

/**
 * Undo of state that is neither cell values nor rows and columns: comments, cell meta, hidden
 * columns. The browser half of this topic is `tests/e2e/undo-plugin-state.spec.ts`.
 */
describe('UndoRedo – plugin state and cell meta', () => {
  const grid = setUpUndoGrid();

  // DEV-515
  it('should undo and redo adding, editing, locking and removing a comment', () => {
    const hot = grid.create({ data: spreadsheet(3, 3), comments: true });
    const comments = hot.getPlugin('comments');
    const undoRedo = hot.getPlugin('undoRedo');
    const comment = () => hot.getCellMeta(0, 0).comment ?? null;

    comments.setCommentAtCell(0, 0, 'First');
    comments.setCommentAtCell(0, 0, 'Second');
    comments.updateCommentMeta(0, 0, { readOnly: true });
    comments.removeCommentAtCell(0, 0);

    expect(comment()).toBeNull();

    undoRedo.undo();

    expect(comment()).toEqual({ value: 'Second', readOnly: true });

    undoRedo.undo();

    expect(comment()).toEqual({ value: 'Second' });

    undoRedo.undo();

    expect(comment()).toEqual({ value: 'First' });

    undoRedo.undo();

    expect(comment()).toBeNull();

    undoRedo.redo();
    undoRedo.redo();
    undoRedo.redo();

    expect(comment()).toEqual({ value: 'Second', readOnly: true });
  });

  // DEV-137
  it('should undo and redo a `className` and a `readOnly` set with `setCellMeta()`', () => {
    const hot = grid.create({ data: spreadsheet(3, 3) });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setCellMeta(1, 1, 'className', 'blue');
    hot.setCellMeta(2, 2, 'readOnly', true);

    undoRedo.undo();

    expect(hot.getCellMeta(2, 2).readOnly).toBe(false);
    expect(hot.getCellMeta(1, 1).className).toBe('blue');

    undoRedo.undo();

    expect(hot.getCellMeta(1, 1).className).toBeUndefined();

    undoRedo.redo();
    undoRedo.redo();

    expect(hot.getCellMeta(1, 1).className).toBe('blue');
    expect(hot.getCellMeta(2, 2).readOnly).toBe(true);
  });

  // DEV-2806
  it('should undo hiding columns', () => {
    const hot = grid.create({ data: spreadsheet(3, 5), hiddenColumns: true });
    const hiddenColumns = hot.getPlugin('hiddenColumns');

    hiddenColumns.hideColumns([1, 3]);

    expect(hiddenColumns.getHiddenColumns()).toEqual([1, 3]);

    hot.getPlugin('undoRedo').undo();

    expect(hiddenColumns.getHiddenColumns()).toEqual([]);
  });
});
