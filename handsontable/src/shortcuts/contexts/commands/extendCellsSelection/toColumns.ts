import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionToColumns',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const activeRange = hot.getSelectedRangeActive();

    if (!activeRange) {
      return;
    }

    const { highlight, from, to } = activeRange;

    selection.markSource('keyboard');

    if (selection.isSelectedByRowHeader()) {
      selection.selectAll(true, true);
    } else {
      hot.selectColumns(from.col ?? 0, to.col ?? 0, highlight);
    }

    selection.markEndSource();
  },
};
