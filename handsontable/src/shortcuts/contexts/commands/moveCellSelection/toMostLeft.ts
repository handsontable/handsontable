import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionToMostLeft',
  callback(hot: HotInstance) {
    const { selection, columnIndexMapper } = hot;
    const row = hot.getSelectedRangeActive()?.highlight.row ?? 0;
    let column = hot.isRtl()
      ? columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1)
      : columnIndexMapper.getNearestNotHiddenIndex(0, 1);

    if (column === null) {
      column = hot.isRtl() ? -1 : -hot.countRowHeaders();
    }

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(row, column));
    selection.markEndSource();
  },
};
