export const command = {
  name: 'extendCellsSelectionDownByViewportHeight',
  callback(hot) {
    const { selection, rowIndexMapper } = hot;
    const { to } = hot.getSelectedRangeActive();
    const nextRowIndexToSelect = Math.min(to.row + hot.countVisibleRows(), hot.countRows() - 1);
    const row = rowIndexMapper.getNearestNotHiddenIndex(nextRowIndexToSelect, -1);

    if (row !== null) {
      const coords = hot._createCellCoords(row, to.col);
      const scrollPadding = to.row - hot.getFirstFullyVisibleRow();
      const nextVerticalScroll = Math.min(coords.row - scrollPadding, hot.countRows() - 1);

      selection.markSource('keyboard');
      selection.setRangeEnd(coords, hot.getActiveSelectionLayerIndex());
      selection.markEndSource();

      hot.scrollViewportTo({
        row: nextVerticalScroll,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
    }
  },
};
