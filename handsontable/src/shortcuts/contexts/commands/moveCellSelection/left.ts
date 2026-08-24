import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionLeft',
  callback(hot: HotInstance) {
    const { selection } = hot;

    selection.markSource('keyboard');
    selection.transformStart(0, -1 * hot.getDirectionFactor());
    selection.markEndSource();
  },
};
