import type { HotInstance } from '../../../common';

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
