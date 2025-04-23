export const command = {
  name: 'moveCellSelectionToMostInlineEnd',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(
      hot.getSelectedRangeLast().highlight.row,
      columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1),
    ));
    selection.markEndSource();
  },
};
