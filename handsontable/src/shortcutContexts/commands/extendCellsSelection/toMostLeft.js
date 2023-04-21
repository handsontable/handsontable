export const command = {
  name: 'extendCellsSelectionToMostLeft',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (highlight.isCell()) {
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [hot.countCols() - 1, -1] : [0, 1])
      );

      selection.setRangeStart(from.clone());
      selection.setRangeEnd(hot._createCellCoords(to.row, column));
    }
  },
};
