import type { HotInstance } from '../../../common';

export const command = {
  name: 'editorFastOpen',
  callback(hot: HotInstance, event: KeyboardEvent) {
    const { highlight } = hot.getSelectedRangeActive();

    if (highlight.isHeader()) {
      return;
    }

    hot._getEditorManager().openEditor(null, event, true);
  },
};
