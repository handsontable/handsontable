export const command = {
  name: 'editorCloseAndSave',
  callback(hot, event) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges(event.ctrlKey || event.metaKey);
    editorManager.moveSelectionAfterEnter(event);
  },
};
