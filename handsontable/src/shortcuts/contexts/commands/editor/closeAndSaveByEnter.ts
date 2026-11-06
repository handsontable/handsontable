import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'editorCloseAndSaveByEnter',
  callback(hot: HotInstance, event: KeyboardEvent) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndSaveChanges(event.ctrlKey || event.metaKey);

    // A listener of the save (`beforeChange`, `beforeValidate`, ...) destroyed the grid.
    if (hot.isDestroyed) {
      return;
    }

    editorManager.moveSelectionAfterEnter(event);
  },
};
