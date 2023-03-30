export const command = {
  name: 'moveCellSelectionUpByViewportHight',
  callback(hot) {
    hot.selection.transformStart(-hot.countVisibleRows(), 0);
  },
};
