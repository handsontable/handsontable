export const command = {
  name: 'extendCellsSelectionRight',
  callback(hot) {
    hot.selection.transformEnd(0, hot.getDirectionFactor());
  },
};
