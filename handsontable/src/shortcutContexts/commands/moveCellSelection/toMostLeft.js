export const command = {
  name: 'moveCellSelectionToMostLeft',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const row = hot.getSelectedRangeLast().highlight.row;
    const column = columnIndexMapper.getNearestNotHiddenIndex(
      ...(hot.isRtl() ? [hot.countCols() - 1, -1] : [0, 1])
    );

    selection.setRangeStart(hot._createCellCoords(row, column));
  },
};
