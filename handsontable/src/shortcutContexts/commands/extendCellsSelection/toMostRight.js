export const command = {
  name: 'extendCellsSelectionToMostRight',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { from, to } = hot.getSelectedRangeLast();
    const column = columnIndexMapper.getNearestNotHiddenIndex(
      ...(hot.isRtl() ? [0, 1] : [hot.countCols() - 1, -1])
    );

    selection.setRangeStart(from.clone());
    selection.setRangeEnd(hot._createCellCoords(to.row, column));
  },
};
