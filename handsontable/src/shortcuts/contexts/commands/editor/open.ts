import type { HotInstance } from '../../../../core/types';
import { stopImmediatePropagation } from '../../../../helpers/dom/event';

export const command = {
  name: 'editorOpen',
  callback(hot: HotInstance, event: KeyboardEvent, keys: string[]) {
    const { selection } = hot;
    const editorManager = hot._getEditorManager();
    const selectedRanges = hot.getSelectedRange();
    const selectedRange = hot.getSelectedRangeActive();
    const highlight = selectedRange?.highlight;

    // supports for navigating with enter key when multiple cells are selected
    if (
      (
        selectedRanges?.some((range: object) =>
          selection.isMultiple(range as import('../../../../3rdparty/walkontable/src/cell/range').default)) ||
        (selectedRanges?.length ?? 0) > 1
      ) &&
      !selectedRange?.isHeader() &&
      hot.countRenderedCols() > 0 &&
      hot.countRenderedRows() > 0
    ) {
      const settings = hot.getSettings();
      const enterMoves = typeof settings.enterMoves === 'function'
        ? settings.enterMoves(event)
        : settings.enterMoves;

      if (keys.includes('shift')) {
        selection.transformFocus(-(enterMoves?.row ?? 0), -(enterMoves?.col ?? 0));
      } else {
        selection.transformFocus(enterMoves?.row ?? 0, enterMoves?.col ?? 0);
      }

      return;
    }

    if (highlight?.isHeader()) {
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
