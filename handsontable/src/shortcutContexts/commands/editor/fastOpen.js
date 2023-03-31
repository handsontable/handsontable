export const command = {
  name: 'editorFastOpen',
  callback(hot, event) {
    hot._getEditorManager().openEditor(null, event, true);
  },
};
