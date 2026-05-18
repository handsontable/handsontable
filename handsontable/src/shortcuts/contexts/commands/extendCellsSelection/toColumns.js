export const command = {
  name: 'extendCellsSelectionToColumns',
  callback(hot) {
    const { selection } = hot;
    const { highlight, from, to } = hot.getSelectedRangeActive();

    selection.markSource('keyboard');

    if (selection.isSelectedByRowHeader()) {
      selection.selectAll(true, true);
    } else {
      hot.selectColumns(from.col, to.col, highlight);
    }

    selection.markEndSource();
  },
};
