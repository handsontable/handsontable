export const command = {
  name: 'editorCloseAndSaveByEnter',
  callback(hot, event) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges(event.ctrlKey || event.metaKey);
    editorManager.moveSelectionAfterEnter(event);
  },
};
