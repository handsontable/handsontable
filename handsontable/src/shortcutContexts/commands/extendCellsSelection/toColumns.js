export const command = {
  name: 'extendCellsSelectionToColumns',
  callback(hot) {
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (hot.selection.isSelectedByRowHeader()) {
      hot.selection.selectAll(true, true);
    } else {
      hot.selectColumns(from.col, to.col, highlight);
    }
  },
};
