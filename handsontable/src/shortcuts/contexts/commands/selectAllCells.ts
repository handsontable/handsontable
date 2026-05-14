import type { HotInstance } from '../../../core/types';

export const command = {
  name: 'selectAllCells',
  callback({ selection }: HotInstance) {
    selection.markSource('keyboard');
    selection.selectAll(true, true, {
      disableHeadersHighlight: true,
    });
    selection.markEndSource();
  },
};
