export const command = {
  name: 'extendCellsSelectionToMostInlineEnd',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (
      !hot.selection.isSelectedByRowHeader() &&
      !hot.selection.isSelectedByCorner() &&
      highlight.isCell()
    ) {
      const column = columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1);
      const newFrom = from.clone();

      newFrom.col = highlight.col;
      selection.setRangeStart(newFrom, undefined, false, highlight.clone());
      selection.setRangeEnd(hot._createCellCoords(to.row, column));
    }
  },
};
