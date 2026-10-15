import type { HotInstance } from '../../../../core/types';
import { getLastScrollableColumn } from '../getLastScrollableColumn';

export const command = {
  name: 'moveCellSelectionToMostBottomInlineEnd',
  callback(hot: HotInstance) {
    const {
      selection,
      rowIndexMapper,
    } = hot;
    const fixedRows = hot.view.countFixedRowsBottom();
    const row = rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - fixedRows - 1, -1);
    const column = getLastScrollableColumn(hot);

    // The start and end columns cover the grid, so there is no column to move the selection to.
    if (column === null && (hot.getSettings().fixedColumnsEnd ?? 0) > 0) {
      return;
    }

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(row ?? -1, column ?? -1));
    selection.markEndSource();
  },
};
