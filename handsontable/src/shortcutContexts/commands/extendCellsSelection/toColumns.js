export const command = {
  name: 'extendCellsSelectionToColumns',
  callback(hot) {
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (from.col < 0 || to.col < 0) {
      hot.selectAll(true, true, highlight);
    } else {
      hot.selectColumns(from.col, to.col, highlight.row);
    }
  },
};
