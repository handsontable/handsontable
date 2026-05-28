import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionToMostLeft',
  callback(hot: HotInstance) {
    const { selection, columnIndexMapper } = hot;
    const activeRange = hot.getSelectedRangeActive();

    if (!activeRange) {
      return;
    }

    const { highlight, from, to } = activeRange;
    const isFocusHighlightedByHeader = highlight.isHeader() && selection.isSelectedByColumnHeader();

    if (highlight.isCell() || isFocusHighlightedByHeader) {
      const column = hot.isRtl()
        ? columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1)
        : columnIndexMapper.getNearestNotHiddenIndex(0, 1);
      const newFrom = from.clone();

      newFrom.col = highlight.col;

      selection.markSource('keyboard');
      selection.setRangeStart(newFrom, undefined, false, highlight.clone());

      // Restore the column highlight by header flag after setting up a new selection.
      if (isFocusHighlightedByHeader) {
        selection.selectedByColumnHeader.add(selection.getLayerLevel());
      }

      selection.setRangeEnd(hot._createCellCoords(to.row ?? 0, column ?? 0));
      selection.markEndSource();
    }
  },
};
