export const command = {
  name: 'extendCellsSelectionToRows',
  callback(hot) {
    const { selection } = hot;
    const { highlight, from, to } = hot.getSelectedRangeActive();

    selection.markSource('keyboard');

    if (selection.isSelectedByColumnHeader()) {
      selection.selectAll(true, true);
    } else {
      hot.selectRows(from.row, to.row, highlight);
    }

    selection.markEndSource();
  },
};
