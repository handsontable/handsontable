export const command = {
  name: 'moveCellSelectionToMostBottom',
  callback(hot) {
    const { col } = hot.getSelectedRangeLast().highlight;
    let row = hot.rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - 1, -1);

    if (row === null) {
      row = -1;
    }

    hot.selection.setRangeStart(hot._createCellCoords(row, col));
  },
};
