import type { HotInstance } from '../../../common';

export const command = {
  name: 'moveCellSelectionDown',
  callback({ selection }: HotInstance) {
    selection.markSource('keyboard');
    selection.transformStart(1, 0);
    selection.markEndSource();
  },
};
