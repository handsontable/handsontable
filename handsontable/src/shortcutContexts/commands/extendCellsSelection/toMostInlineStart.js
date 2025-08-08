export const command = {
  name: 'extendCellsSelectionToMostInlineStart',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeActive();

    if (
      !selection.isSelectedByRowHeader() &&
      !selection.isSelectedByCorner() &&
      highlight.isCell()
    ) {
      const fixedColumns = parseInt(hot.getSettings().fixedColumnsStart, 10);
      const column = columnIndexMapper.getNearestNotHiddenIndex(fixedColumns, 1);
      const newFrom = from.clone();

      newFrom.col = highlight.col;

      selection.markSource('keyboard');
      selection.setRangeStart(newFrom, undefined, false, highlight.clone());
      selection.setRangeEnd(hot._createCellCoords(to.row, column));
      selection.markEndSource();
    }
  },
};
