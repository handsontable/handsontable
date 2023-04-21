export const command = {
  name: 'extendCellsSelectionToMostRight',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (highlight.isCell()) {
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [0, 1] : [hot.countCols() - 1, -1])
      );

      selection.setRangeStart(from.clone());
      selection.setRangeEnd(hot._createCellCoords(to.row, column));
    }
  },
};
