export const command = {
  name: 'extendCellsSelectionToMostInlineStart',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;

    selection.setRangeEnd(hot._createCellCoords(
      selection.selectedRange.current().from.row,
      columnIndexMapper.getNearestNotHiddenIndex(0, 1),
    ));
  },
};
