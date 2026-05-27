export const command = {
  name: 'moveCellSelectionToMostTop',
  callback(hot) {
    const { selection } = hot;
    const { col } = hot.getSelectedRangeActive().highlight;
    let row = hot.rowIndexMapper.getNearestNotHiddenIndex(0, 1);

    if (row === null) {
      row = -hot.countColHeaders();
    }

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(row, col));
    selection.markEndSource();
  },
};
