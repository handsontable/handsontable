import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'editorCloseAndSave',
  callback(hot: HotInstance) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges();
  },
};
