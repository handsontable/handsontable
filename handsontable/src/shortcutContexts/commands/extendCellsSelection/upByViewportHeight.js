export const command = {
  name: 'extendCellsSelectionUpByViewportHeight',
  callback(hot) {
    const { to } = hot.getSelectedRangeLast();
    const nextRowIndexToSelect = Math.max(to.row - hot.countVisibleRows(), 0);
    const row = hot.rowIndexMapper.getNearestNotHiddenIndex(nextRowIndexToSelect, 1);

    if (row !== null) {
      const coords = hot._createCellCoords(row, to.col);
      const scrollPadding = to.row - hot.getFirstFullyVisibleRow();
      const nextVerticalScroll = Math.max(coords.row - scrollPadding, 0);

      hot.selection.setRangeEnd(coords);
      hot.scrollViewportTo({
        row: nextVerticalScroll,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
    }
  },
};
