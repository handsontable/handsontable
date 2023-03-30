export const command = {
  name: 'extendCellsSelectionToMostBottom',
  callback(hot) {
    const { selection, rowIndexMapper } = hot;
    const { from, to } = hot.getSelectedRangeLast();
    const row = rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - 1, -1);

    selection.setRangeStart(from.clone());
    selection.setRangeEnd(hot._createCellCoords(row, to.col));
  },
};
