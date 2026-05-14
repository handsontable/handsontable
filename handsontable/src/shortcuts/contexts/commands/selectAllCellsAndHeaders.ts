import type { HotInstance } from '../../../core/types';

export const command = {
  name: 'selectAllCellsAndHeaders',
  callback({ selection }: HotInstance) {
    selection.markSource('keyboard');
    selection.selectAll(true, true, {
      disableHeadersHighlight: false,
    });
    selection.markEndSource();
  },
};
