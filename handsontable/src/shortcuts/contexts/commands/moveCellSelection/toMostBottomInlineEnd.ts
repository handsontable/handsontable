import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionToMostBottomInlineEnd',
  callback(hot: HotInstance) {
    const {
      selection,
      rowIndexMapper,
      columnIndexMapper,
    } = hot;
    const fixedRows = Number(hot.getSettings().fixedRowsBottom) || 0;
    const row = rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - fixedRows - 1, -1);
    const column = columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1);

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(row, column));
    selection.markEndSource();
  },
};
