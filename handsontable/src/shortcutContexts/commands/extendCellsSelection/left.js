export const command = {
  name: 'extendCellsSelectionLeft',
  callback(hot) {
    const { highlight } = hot.getSelectedRangeLast();

    if (highlight.isCell() || highlight.isHeader() && hot.selection.isSelectedByColumnHeader()) {
      hot.selection.transformEnd(0, -1 * hot.getDirectionFactor());
    }
  },
};
