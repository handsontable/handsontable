export const command = {
  name: 'extendCellsSelectionToMostRight',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeActive();
    const isFocusHighlightedByHeader = highlight.isHeader() && selection.isSelectedByColumnHeader();

    if (highlight.isCell() || isFocusHighlightedByHeader) {
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [0, 1] : [hot.countCols() - 1, -1])
      );
      const newFrom = from.clone();

      newFrom.col = highlight.col;

      selection.markSource('keyboard');
      selection.setRangeStart(newFrom, undefined, false, highlight.clone());

      // Restore the column highlight by header flag after setting up a new selection.
      if (isFocusHighlightedByHeader) {
        selection.selectedByColumnHeader.add(selection.getLayerLevel());
      }

      selection.setRangeEnd(hot._createCellCoords(to.row, column));
      selection.markEndSource();
    }
  },
};
