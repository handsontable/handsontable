import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'extendCellsSelectionToRows',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const { highlight, from, to } = hot.getSelectedRangeActive();

    selection.markSource('keyboard');

    if (selection.isSelectedByColumnHeader()) {
      selection.selectAll(true, true);
    } else {
      hot.selectRows(from.row, to.row, highlight);
    }

    selection.markEndSource();
  },
};
