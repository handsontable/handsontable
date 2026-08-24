import type { HotInstance } from '../../../core/types';

export const command = {
  name: 'emptySelectedCells',
  callback(hot: HotInstance) {
    hot.emptySelectedCells();
    hot._getEditorManager().prepareEditor();
  },
};
