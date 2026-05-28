import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionUp',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const highlight = hot.getSelectedRangeActive()?.highlight;

    if (
      !selection.isSelectedByColumnHeader() &&
      !selection.isSelectedByCorner() &&
      (highlight?.isCell() || highlight?.isHeader() && selection.isSelectedByRowHeader())
    ) {
      selection.markSource('keyboard');
      selection.transformEnd(-1, 0);
      selection.markEndSource();
    }
  },
};
