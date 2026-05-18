export const command = {
  name: 'moveCellSelectionToMostBottom',
  callback(hot) {
    const { selection } = hot;
    const { col } = hot.getSelectedRangeActive().highlight;
    let row = hot.rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - 1, -1);

    if (row === null) {
      row = -1;
    }

    selection.setRangeStart(hot._createCellCoords(row, col));
  },
};
