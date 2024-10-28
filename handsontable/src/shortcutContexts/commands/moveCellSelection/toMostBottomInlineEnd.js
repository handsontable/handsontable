export const command = {
  name: 'moveCellSelectionToMostBottomInlineEnd',
  callback(hot) {
    const { selection, rowIndexMapper, columnIndexMapper } = hot;
    const fixedRows = parseInt(hot.getSettings().fixedRowsBottom, 10);
    const row = rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - fixedRows - 1, -1);
    const column = columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1);

    selection.setRangeStart(hot._createCellCoords(row, column));
  },
};
