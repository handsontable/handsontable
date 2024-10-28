export const command = {
  name: 'extendCellsSelectionDownByViewportHeight',
  callback(hot) {
    const { to } = hot.getSelectedRangeLast();
    const nextRowIndexToSelect = Math.min(to.row + hot.countVisibleRows(), hot.countRows() - 1);
    const row = hot.rowIndexMapper.getNearestNotHiddenIndex(nextRowIndexToSelect, -1);

    if (row !== null) {
      const coords = hot._createCellCoords(row, to.col);
      const scrollPadding = to.row - hot.getFirstFullyVisibleRow();
      const nextVerticalScroll = Math.min(coords.row - scrollPadding, hot.countRows() - 1);

      hot.selection.setRangeEnd(coords);
      hot.scrollViewportTo({
        row: nextVerticalScroll,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
    }
  },
};
