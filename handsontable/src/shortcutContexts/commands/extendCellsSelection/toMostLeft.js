export const command = {
  name: 'extendCellsSelectionToMostLeft',
  callback(hot) {
    const { selection, columnIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (highlight.isCell() || highlight.isHeader() && hot.selection.isSelectedByColumnHeader()) {
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [hot.countCols() - 1, -1] : [0, 1])
      );

      selection.setRangeStart(from.clone());
      selection.selectedByColumnHeader.add(selection.getLayerLevel());
      selection.setRangeEnd(hot._createCellCoords(to.row, column));
    }
  },
};