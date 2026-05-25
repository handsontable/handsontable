import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionToMostInlineStart',
  callback(hot: HotInstance) {
    const { selection, columnIndexMapper } = hot;
    const fixedColumns = Number(hot.getSettings().fixedColumnsStart) || 0;
    const row = hot.getSelectedRangeActive().highlight.row;
    const column = columnIndexMapper.getNearestNotHiddenIndex(fixedColumns, 1);

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(row, column));
    selection.markEndSource();
  },
};
