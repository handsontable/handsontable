export const command = {
  name: 'extendCellsSelectionToColumns',
  callback(hot) {
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (hot.selection.isSelectedByRowHeader()) {
      hot.selectAll(true, true, highlight);
    } else {
      hot.selectColumns(from.col, to.col, highlight.row);
    }
  },
};
