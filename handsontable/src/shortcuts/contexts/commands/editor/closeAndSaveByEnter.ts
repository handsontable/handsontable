import type { HotInstance } from '../../../../common';

export const command = {
  name: 'editorCloseAndSaveByEnter',
  callback(hot: HotInstance, event: KeyboardEvent) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges(event.ctrlKey || event.metaKey);
    editorManager.moveSelectionAfterEnter(event);
  },
};
