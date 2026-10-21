import type { HotInstance } from '../../../../core/types';
import { getLastScrollableColumn } from '../getLastScrollableColumn';

export const command = {
  name: 'moveCellSelectionToMostInlineEnd',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const column = getLastScrollableColumn(hot);

    // The start and end columns cover the grid, so there is no column to move the selection to.
    if (column === null && (hot.getSettings().fixedColumnsEnd ?? 0) > 0) {
      return;
    }

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(
      hot.getSelectedRangeActive()?.highlight.row ?? 0,
      column ?? 0,
    ));
    selection.markEndSource();
  },
};
