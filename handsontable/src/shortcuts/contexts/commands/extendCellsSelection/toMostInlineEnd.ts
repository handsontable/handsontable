import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionToMostInlineEnd',
  callback(hot: HotInstance) {
    const { selection, columnIndexMapper } = hot;
    const { highlight, from, to } = hot.getSelectedRangeActive();

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
      selection.setRangeEnd(hot._createCellCoords(to.row, column));
      selection.markEndSource();
    }
  },
};
