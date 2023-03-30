export const command = {
  name: 'moveCellSelectionToMostTop',
  callback(hot) {
    hot.selection.setRangeStart(hot._createCellCoords(
      hot.rowIndexMapper.getNearestNotHiddenIndex(0, 1),
      hot.getSelectedRangeLast().highlight.col,
    ));
  },
};
