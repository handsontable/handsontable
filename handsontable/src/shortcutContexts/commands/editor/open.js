import { stopImmediatePropagation } from '../../../helpers/dom/event';

export const command = {
  name: 'editorOpen',
  callback(hot, event, keys) {
    const editorManager = hot._getEditorManager();
    const selectedRange = hot.getSelectedRangeLast();
    const { highlight } = selectedRange;

    // supports for navigating with enter key when multiple cells are selected
    if (
      hot.selection.isMultiple() &&
      !selectedRange.isHeader() &&
      hot.countRenderedCols() > 0 &&
      hot.countRenderedRows() > 0
    ) {
      const settings = hot.getSettings();
      const enterMoves = typeof settings.enterMoves === 'function'
        ? settings.enterMoves(event)
        : settings.enterMoves;

      if (keys.includes('shift')) {
        hot.selection.transformFocus(-enterMoves.row, -enterMoves.col);
      } else {
        hot.selection.transformFocus(enterMoves.row, enterMoves.col);
      }

      return;
    }

    if (highlight.isHeader()) {
      return;
    }

    // supports editor opening with enter key
    if (hot.getSettings().enterBeginsEditing) {
      if (editorManager.cellProperties.readOnly) {
        editorManager.moveSelectionAfterEnter(event);

      } else {
        editorManager.openEditor(null, event, true);
      }

    } else {
      editorManager.moveSelectionAfterEnter(event);
    }

    stopImmediatePropagation(event); // required by HandsontableEditor
  },
};
