import type { HotInstance } from '../../../common';

export const command = {
  name: 'editorCloseAndSave',
  callback(hot: HotInstance) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges();
  },
};
