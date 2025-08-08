export const command = {
  name: 'moveCellSelectionToMostInlineStart',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const fixedColumns = parseInt(hot.getSettings().fixedColumnsStart, 10);
    const row = hot.getSelectedRangeActive().highlight.row;
    const column = columnIndexMapper.getNearestNotHiddenIndex(fixedColumns, 1);

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(row, column));
    selection.markEndSource();
  },
};
