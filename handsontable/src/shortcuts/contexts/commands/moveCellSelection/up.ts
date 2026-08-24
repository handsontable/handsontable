import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionUp',
  callback({ selection }: HotInstance) {
    selection.markSource('keyboard');
    selection.transformStart(-1, 0);
    selection.markEndSource();
  },
};
