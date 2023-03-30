export const command = {
  name: 'moveCellSelectionDownByViewportHeight',
  callback(hot) {
    hot.selection.transformStart(hot.countVisibleRows(), 0);
  },
};
