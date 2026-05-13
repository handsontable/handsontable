import type { HotInstance } from '../../../common';

export const command = {
  name: 'emptySelectedCells',
  callback(hot: HotInstance) {
    hot.emptySelectedCells();
    hot._getEditorManager().prepareEditor();
  },
};
