import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'editorFastOpen',
  callback(hot: HotInstance, event: KeyboardEvent) {
    const highlight = hot.getSelectedRangeActive()?.highlight;

    if (highlight?.isHeader()) {
      return;
    }

    hot._getEditorManager().openEditor(null, event, true);
  },
};
