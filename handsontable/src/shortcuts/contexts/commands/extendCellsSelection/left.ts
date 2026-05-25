import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionLeft',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const { highlight } = hot.getSelectedRangeActive();

    if (
      !selection.isSelectedByRowHeader() &&
      !selection.isSelectedByCorner() &&
      (highlight.isCell() || highlight.isHeader() && selection.isSelectedByColumnHeader())
    ) {
      selection.markSource('keyboard');
      selection.transformEnd(0, -1 * hot.getDirectionFactor());
      selection.markEndSource();
    }
  },
};
