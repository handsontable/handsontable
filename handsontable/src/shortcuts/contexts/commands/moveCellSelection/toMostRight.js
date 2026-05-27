export const command = {
  name: 'moveCellSelectionToMostRight',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { row } = hot.getSelectedRangeActive().highlight;
    let column = columnIndexMapper.getNearestNotHiddenIndex(
      ...(hot.isRtl() ? [0, 1] : [hot.countCols() - 1, -1])
    );

    if (column === null) {
      column = hot.isRtl() ? -hot.countRowHeaders() : -1;
    }

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(row, column));
    selection.markEndSource();
  },
};
