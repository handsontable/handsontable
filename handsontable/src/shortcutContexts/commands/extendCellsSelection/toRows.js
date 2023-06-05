export const command = {
  name: 'extendCellsSelectionToRows',
  callback(hot) {
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (hot.selection.isSelectedByColumnHeader()) {
      hot.selectAll(true, true, highlight);
    } else {
      hot.selectRows(from.row, to.row, highlight.col);
    }
  },
};
