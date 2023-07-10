export const command = {
  name: 'extendCellsSelectionToMostRight',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeLast();
    const isFocusHighlightedByHeader = highlight.isHeader() && hot.selection.isSelectedByColumnHeader();

    if (highlight.isCell() || isFocusHighlightedByHeader) {
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [0, 1] : [hot.countCols() - 1, -1])
      );

      selection.setRangeStart(from.clone());

      // Restore the column highlight by header flag after setting up a new selection.
      if (isFocusHighlightedByHeader) {
        selection.selectedByColumnHeader.add(selection.getLayerLevel());
      }

      selection.setRangeEnd(hot._createCellCoords(to.row, column));
    }
  },
};
