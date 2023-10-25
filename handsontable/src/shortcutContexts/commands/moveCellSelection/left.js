export const command = {
  name: 'moveCellSelectionLeft',
  callback(hot) {
    hot.selection.transformStart(0, -1 * hot.getDirectionFactor());
  },
};
