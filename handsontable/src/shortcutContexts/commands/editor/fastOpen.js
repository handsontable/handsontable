export const command = {
  name: 'editorFastOpen',
  callback(hot, event) {
    const { highlight } = hot.getSelectedRangeActive();

    if (highlight.isHeader()) {
      return;
    }

    hot._getEditorManager().openEditor(null, event, true);
  },
};
