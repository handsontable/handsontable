import { stopImmediatePropagation } from '../../../helpers/dom/event';

export const command = {
  name: 'editorOpen',
  callback(hot, event, keys) {
    const { selection } = hot;
    const editorManager = hot._getEditorManager();
    const selectedRanges = hot.getSelectedRange();
    const selectedRange = hot.getSelectedRangeActive();
    const { highlight } = selectedRange;

    // supports for navigating with enter key when multiple cells are selected
    if (
      (
        selectedRanges.some(range => selection.isMultiple(range)) ||
        selectedRanges.length > 1
      ) &&
      !selectedRange.isHeader() &&
      hot.countRenderedCols() > 0 &&
      hot.countRenderedRows() > 0
    ) {
      const settings = hot.getSettings();
      const enterMoves = typeof settings.enterMoves === 'function'
        ? settings.enterMoves(event)
        : settings.enterMoves;

      if (keys.includes('shift')) {
        selection.transformFocus(-enterMoves.row, -enterMoves.col);
      } else {
        selection.transformFocus(enterMoves.row, enterMoves.col);
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
