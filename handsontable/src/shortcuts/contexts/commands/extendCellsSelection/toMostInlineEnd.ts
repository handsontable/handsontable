import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionToMostInlineEnd',
  callback(hot: HotInstance) {
    const { selection, columnIndexMapper } = hot;
    const activeRange = hot.getSelectedRangeActive();

    if (!activeRange) {
      return;
    }

    const { highlight, from, to } = activeRange;

    if (
      !selection.isSelectedByRowHeader() &&
      !selection.isSelectedByCorner() &&
      highlight.isCell()
    ) {
      const column = columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1);
      const newFrom = from.clone();

      newFrom.col = highlight.col;

      selection.markSource('keyboard');
      selection.setRangeStart(newFrom, undefined, false, highlight.clone());
      selection.setRangeEnd(hot._createCellCoords(to.row ?? 0, column ?? 0));
      selection.markEndSource();
    }
  },
};
