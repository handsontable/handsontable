export const command = {
  name: 'extendCellsSelectionToMostBottom',
  callback(hot) {
    const { selection, rowIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeLast();
    const isFocusHighlightedByHeader = highlight.isHeader() && hot.selection.isSelectedByRowHeader();

    if (highlight.isCell() || isFocusHighlightedByHeader) {
      const row = rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - 1, -1);
      const newFrom = from.clone();

      newFrom.row = highlight.row;

      selection.markSource('keyboard');
      selection.setRangeStart(newFrom, undefined, false, highlight.clone());

      // Restore the row highlight by header flag after setting up a new selection.
      if (isFocusHighlightedByHeader) {
        selection.selectedByRowHeader.add(selection.getLayerLevel());
      }

      selection.setRangeEnd(hot._createCellCoords(row, to.col));
      selection.markEndSource();
    }
  },
};
