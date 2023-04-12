export const command = {
  name: 'extendCellsSelectionUp',
  callback(hot) {
    const { highlight } = hot.getSelectedRangeLast();

    // if (highlight.isCell() || highlight.isHeader() && hot.selection.isSelectedByRowHeader()) {
    if (highlight.isCell()) {
      hot.selection.transformEnd(-1, 0);
    }
  },
};
