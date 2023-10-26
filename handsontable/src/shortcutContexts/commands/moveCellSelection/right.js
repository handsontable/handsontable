export const command = {
  name: 'moveCellSelectionRight',
  callback(hot) {
    hot.selection.transformStart(0, hot.getDirectionFactor());
  },
};
