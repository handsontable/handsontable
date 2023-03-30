export const command = {
  name: 'moveCellSelectionToMostBottom',
  callback(hot) {
    const { selection, rowIndexMapper } = hot;

    selection.setRangeStart(hot._createCellCoords(
      rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - 1, -1),
      hot.getSelectedRangeLast().highlight.col,
    ));
  },
};
