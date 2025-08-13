export const command = {
  name: 'extendCellsSelectionUpByViewportHeight',
  callback(hot) {
    const { selection, rowIndexMapper } = hot;
    const { to } = hot.getSelectedRangeActive();
    const nextRowIndexToSelect = Math.max(to.row - hot.countVisibleRows(), 0);
    const row = rowIndexMapper.getNearestNotHiddenIndex(nextRowIndexToSelect, 1);

    if (row !== null) {
      const coords = hot._createCellCoords(row, to.col);
      const scrollPadding = to.row - hot.getFirstFullyVisibleRow();
      const nextVerticalScroll = Math.max(coords.row - scrollPadding, 0);

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
