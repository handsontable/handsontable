export const command = {
  name: 'extendCellsSelectionToMostLeft',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { from, to } = hot.getSelectedRangeLast();
    const column = columnIndexMapper.getNearestNotHiddenIndex(
      ...(hot.isRtl() ? [hot.countCols() - 1, -1] : [0, 1])
    );

    selection.setRangeStart(from.clone());
    selection.setRangeEnd(hot._createCellCoords(to.row, column));
  },
};
