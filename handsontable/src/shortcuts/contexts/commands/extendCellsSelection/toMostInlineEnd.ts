import type { HotInstance } from '../../../../core/types';
import { getLastScrollableColumn } from '../getLastScrollableColumn';

export const command = {
  name: 'extendCellsSelectionToMostInlineEnd',
  callback(hot: HotInstance) {
    const { selection } = hot;
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
      const column = getLastScrollableColumn(hot);

      // The start and end columns cover the grid, so there is no column to extend the selection to.
      if (column === null && (hot.getSettings().fixedColumnsEnd ?? 0) > 0) {
        return;
      }

      const newFrom = from.clone();

      newFrom.col = highlight.col;

      selection.markSource('keyboard');
      selection.setRangeStart(newFrom, undefined, false, highlight.clone());
      selection.setRangeEnd(hot._createCellCoords(to.row ?? 0, column ?? 0));
      selection.markEndSource();
    }
  },
};
