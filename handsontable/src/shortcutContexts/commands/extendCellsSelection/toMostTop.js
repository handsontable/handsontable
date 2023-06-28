export const command = {
  name: 'extendCellsSelectionToMostTop',
  callback(hot) {
    const { selection, rowIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeLast();

    if (highlight.isCell() || highlight.isHeader() && hot.selection.isSelectedByRowHeader()) {
      const row = rowIndexMapper.getNearestNotHiddenIndex(0, 1);

      selection.setRangeStart(from.clone());
      selection.selectedByRowHeader.add(selection.getLayerLevel());
      selection.setRangeEnd(hot._createCellCoords(row, to.col));
    }
  },
};
