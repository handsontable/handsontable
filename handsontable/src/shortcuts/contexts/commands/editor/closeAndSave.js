export const command = {
  name: 'editorCloseAndSave',
  callback(hot) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges();
  },
};
