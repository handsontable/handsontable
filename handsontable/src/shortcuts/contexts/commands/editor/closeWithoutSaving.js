export const command = {
  name: 'editorCloseWithoutSaving',
  callback(hot) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndRestoreOriginalValue(hot.getShortcutManager().isCtrlPressed());
    editorManager.activeEditor.focus();
  },
};
