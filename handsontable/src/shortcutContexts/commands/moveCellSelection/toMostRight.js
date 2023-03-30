export const command = {
  name: 'moveCellSelectionToMostRight',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const row = hot.getSelectedRangeLast().highlight.row;
    const column = columnIndexMapper.getNearestNotHiddenIndex(
      ...(hot.isRtl() ? [0, 1] : [hot.countCols() - 1, -1])
    );

    selection.setRangeStart(hot._createCellCoords(row, column));
  },
};
