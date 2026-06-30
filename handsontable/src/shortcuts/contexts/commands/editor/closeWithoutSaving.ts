import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'editorCloseWithoutSaving',
  callback(hot: HotInstance) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndRestoreOriginalValue(hot.getShortcutManager().isCtrlPressed());
    editorManager.activeEditor?.focus();
  },
};
