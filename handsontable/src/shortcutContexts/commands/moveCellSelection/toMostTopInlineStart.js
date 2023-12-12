export const command = {
  name: 'moveCellSelectionToMostTopInlineStart',
  callback(hot) {
    const { selection, rowIndexMapper, columnIndexMapper } = hot;
    const fixedRows = parseInt(hot.getSettings().fixedRowsTop, 10);
    const fixedColumns = parseInt(hot.getSettings().fixedColumnsStart, 10);
    const row = rowIndexMapper.getNearestNotHiddenIndex(fixedRows, 1);
    const column = columnIndexMapper.getNearestNotHiddenIndex(fixedColumns, 1);

    selection.setRangeStart(hot._createCellCoords(row, column));
  },
};
