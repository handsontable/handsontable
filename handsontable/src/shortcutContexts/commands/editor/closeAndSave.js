export const command = {
  name: 'editorCloseAndSave',
  callback(hot, event, keys) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges(hot.getShortcutManager().isCtrlPressed());
    editorManager.moveSelectionAfterEnter(keys.includes('shift'));
  },
};
