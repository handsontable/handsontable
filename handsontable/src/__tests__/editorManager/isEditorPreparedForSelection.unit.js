import EditorManager from '../../editorManager';

describe('EditorManager', () => {
  function createEditorManager(getCell = () => null) {
    return new EditorManager(
      {
        addHook: () => {},
        view: {
          _wt: {
            update: () => {},
          },
        },
        getCell,
      },
      {},
      {},
    );
  }

  it('should return false when there is no active editor', () => {
    const editorManager = createEditorManager();

    expect(editorManager.isEditorPreparedForSelection({ row: 1, col: 1 })).toBe(false);
  });

  it('should return false when active editor TD is not rendered', () => {
    const editorManager = createEditorManager(() => null);

    editorManager.activeEditor = {
      row: 1,
      col: 1,
      TD: { isConnected: false },
    };

    expect(editorManager.isEditorPreparedForSelection({ row: 1, col: 1 })).toBe(false);
  });

  it('should return true when active editor matches rendered selected cell', () => {
    const td = { isConnected: true };
    const editorManager = createEditorManager(() => td);

    editorManager.activeEditor = {
      row: 1,
      col: 1,
      TD: td,
    };

    expect(editorManager.isEditorPreparedForSelection({ row: 1, col: 1 })).toBe(true);
  });
});
