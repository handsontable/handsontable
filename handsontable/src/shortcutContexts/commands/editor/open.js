import { stopImmediatePropagation } from '../../../helpers/dom/event';

export const command = {
  name: 'editorOpen',
  callback(hot, event, keys) {
    const editorManager = hot._getEditorManager();
    const { highlight } = hot.getSelectedRangeLast();

    if (highlight.isHeader()) {
      return;
    }

    if (hot.getSettings().enterBeginsEditing) {
      if (editorManager.cellProperties.readOnly) {
        editorManager.moveSelectionAfterEnter();

      } else {
        editorManager.openEditor(null, event, true);
      }

    } else {
      editorManager.moveSelectionAfterEnter(keys.includes('shift'));
    }

    stopImmediatePropagation(event); // required by HandsontableEditor
  },
};
