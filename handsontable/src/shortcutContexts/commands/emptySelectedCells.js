export const command = {
  name: 'emptySelectedCells',
  callback(hot) {
    hot.emptySelectedCells();
    hot._getEditorManager().prepareEditor();
  },
};
