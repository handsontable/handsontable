import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionToMostInlineEnd',
  callback(hot: HotInstance) {
    const { selection, columnIndexMapper } = hot;

    selection.markSource('keyboard');
    selection.setRangeStart(hot._createCellCoords(
      hot.getSelectedRangeActive()?.highlight.row ?? 0,
      columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1) ?? 0,
    ));
    selection.markEndSource();
  },
};
