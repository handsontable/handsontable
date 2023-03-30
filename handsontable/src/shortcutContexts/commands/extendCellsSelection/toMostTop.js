export const command = {
  name: 'extendCellsSelectionToMostTop',
  callback(hot) {
    const { selection, rowIndexMapper } = hot;
    const { from, to } = hot.getSelectedRangeLast();
    const row = rowIndexMapper.getNearestNotHiddenIndex(0, 1);

    selection.setRangeStart(from.clone());
    selection.setRangeEnd(hot._createCellCoords(row, to.col));
  },
};
