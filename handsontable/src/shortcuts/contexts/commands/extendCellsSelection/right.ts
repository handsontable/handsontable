import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionRight',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const highlight = hot.getSelectedRangeActive()?.highlight;

    if (
      !selection.isSelectedByRowHeader() &&
      !selection.isSelectedByCorner() &&
      (highlight?.isCell() || highlight?.isHeader() && selection.isSelectedByColumnHeader())
    ) {
      selection.markSource('keyboard');
      selection.transformEnd(0, hot.getDirectionFactor());
      selection.markEndSource();
    }
  },
};
