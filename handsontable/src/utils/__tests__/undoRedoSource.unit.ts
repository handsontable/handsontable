import { isUndoRedoSource } from 'handsontable/utils/undoRedoSource';

describe('isUndoRedoSource', () => {
  it('should tell the undo and redo replay sources apart from every other source', () => {
    expect(isUndoRedoSource('UndoRedo.undo')).toBe(true);
    expect(isUndoRedoSource('UndoRedo.redo')).toBe(true);
    expect(isUndoRedoSource('edit')).toBe(false);
    expect(isUndoRedoSource('UndoRedo')).toBe(false);
    expect(isUndoRedoSource(undefined)).toBe(false);
  });
});
