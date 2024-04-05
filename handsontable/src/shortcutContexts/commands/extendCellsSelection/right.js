export const command = {
  name: 'extendCellsSelectionRight',
  callback(hot) {
    const { highlight } = hot.getSelectedRangeLast();

    if (
      !hot.selection.isSelectedByRowHeader() &&
      !hot.selection.isSelectedByCorner() &&
      (highlight.isCell() || highlight.isHeader() && hot.selection.isSelectedByColumnHeader())
    ) {
      hot.selection.transformEnd(0, hot.getDirectionFactor());
    }
  },
};
