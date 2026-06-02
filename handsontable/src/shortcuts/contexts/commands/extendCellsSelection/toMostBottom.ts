import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionToMostBottom',
  callback(hot: HotInstance) {
    const { selection, rowIndexMapper } = hot;
    const activeRange = hot.getSelectedRangeActive();

    if (!activeRange) {
      return;
    }

    const { highlight, from, to } = activeRange;
    const isFocusHighlightedByHeader = highlight.isHeader() && selection.isSelectedByRowHeader();

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

      selection.setRangeEnd(hot._createCellCoords(row ?? 0, to.col ?? 0));
      selection.markEndSource();
    }
  },
};
