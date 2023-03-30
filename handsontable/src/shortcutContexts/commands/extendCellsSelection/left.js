export const command = {
  name: 'extendCellsSelectionLeft',
  callback(hot) {
    hot.selection.transformEnd(0, -1 * hot.getDirectionFactor());
  },
};
