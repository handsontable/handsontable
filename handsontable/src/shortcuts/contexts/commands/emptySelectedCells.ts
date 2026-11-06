import type { HotInstance } from '../../../core/types';

export const command = {
  name: 'emptySelectedCells',
  callback(hot: HotInstance) {
    hot.emptySelectedCells();

    // A listener of the write (`beforeChange`, `afterChange`, ...) destroyed the grid.
    if (hot.isDestroyed) {
      return;
    }

    hot._getEditorManager().prepareEditor();
  },
};
