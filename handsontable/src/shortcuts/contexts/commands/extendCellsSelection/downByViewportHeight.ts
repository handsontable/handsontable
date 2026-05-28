import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionDownByViewportHeight',
  callback(hot: HotInstance) {
    const { selection, rowIndexMapper } = hot;
    const activeRange = hot.getSelectedRangeActive();

    if (!activeRange) {
      return;
    }

    const { to } = activeRange;
    const toRow = to.row ?? 0;
    const nextRowIndexToSelect = Math.min(toRow + hot.countVisibleRows(), hot.countRows() - 1);
    const row = rowIndexMapper.getNearestNotHiddenIndex(nextRowIndexToSelect, -1);

    if (row !== null) {
      const coords = hot._createCellCoords(row, to.col ?? 0);
      const scrollPadding = toRow - (hot.getFirstFullyVisibleRow() ?? 0);
      const nextVerticalScroll = Math.min((coords.row ?? 0) - scrollPadding, hot.countRows() - 1);

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
