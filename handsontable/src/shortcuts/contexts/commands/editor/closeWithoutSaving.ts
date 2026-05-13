import type { HotInstance } from '../../../common';

export const command = {
  name: 'editorCloseWithoutSaving',
  callback(hot: HotInstance) {
    const editorManager = hot._getEditorManager();

    editorManager.closeEditorAndRestoreOriginalValue(hot.getShortcutManager().isCtrlPressed());
    editorManager.activeEditor.focus();
  },
};
