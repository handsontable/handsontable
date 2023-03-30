export const command = {
  name: 'extendCellsSelectionToMostInlineEnd',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;

    selection.setRangeEnd(hot._createCellCoords(
      selection.selectedRange.current().from.row,
      columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1),
    ));
  },
};
