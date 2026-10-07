import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionToMostTopInlineStart',
  callback(hot: HotInstance) {
    const {
      selection,
      rowIndexMapper,
      columnIndexMapper,
    } = hot;
    const fixedRows = hot.view.countFixedRowsTop();
    const fixedColumns = hot.view.countFixedColumnsStart();
    const row = rowIndexMapper.getNearestNotHiddenIndex(fixedRows, 1);
    const column = columnIndexMapper.getNearestNotHiddenIndex(fixedColumns, 1);

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(row ?? 0, column ?? 0));
    selection.markEndSource();
  },
};
