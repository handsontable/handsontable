import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionToRows',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const activeRange = hot.getSelectedRangeActive();

    if (!activeRange) {
      selection.markEndSource();

      return;
    }

    const { highlight, from, to } = activeRange;

    selection.markSource('keyboard');

    if (selection.isSelectedByColumnHeader()) {
      selection.selectAll(true, true);
    } else {
      hot.selectRows(from.row ?? 0, to.row ?? 0, highlight);
    }

    selection.markEndSource();
  },
};
