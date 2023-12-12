export const command = {
  name: 'editorCloseAndSave',
  callback(hot, event, keys) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges(event.ctrlKey || event.metaKey);
    editorManager.moveSelectionAfterEnter(keys.includes('shift'));
  },
};
