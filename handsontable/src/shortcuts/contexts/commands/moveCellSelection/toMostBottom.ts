import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionToMostBottom',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const col = hot.getSelectedRangeActive()?.highlight.col ?? 0;
    let row = hot.rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - 1, -1);

    if (row === null) {
      row = -1;
    }

    selection.setRangeStart(hot._createCellCoords(row, col));
  },
};
