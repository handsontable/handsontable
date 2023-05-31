export const command = {
  name: 'extendCellsSelectionToRows',
  callback(hot) {
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (from.row < 0 || to.row < 0) {
      hot.selectAll(true, true, highlight);
    } else {
      hot.selectRows(from.row, to.row, highlight.col);
    }
  },
};
