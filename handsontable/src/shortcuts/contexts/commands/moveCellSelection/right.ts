import type { HotInstance } from '../../../common';

export const command = {
  name: 'moveCellSelectionRight',
  callback(hot: HotInstance) {
    const { selection } = hot;

    selection.markSource('keyboard');
    selection.transformStart(0, hot.getDirectionFactor());
    selection.markEndSource();
  },
};
