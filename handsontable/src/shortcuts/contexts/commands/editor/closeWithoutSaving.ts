import type { HotInstance } from '../../../../core/types';
import { getDeepActiveElement, isHTMLElement, isInput } from '../../../../helpers/dom/element';

export const command = {
  name: 'editorCloseWithoutSaving',
  callback(hot: HotInstance) {
    const editorManager = hot._getEditorManager();
    const focusManager = hot.getFocusManager();

    editorManager.closeEditorAndRestoreOriginalValue(hot.getShortcutManager().isCtrlPressed());

    // In the `mixed` focus mode (`imeFastEdit`) the hidden editor field holds the focus on purpose.
    if (focusManager.getFocusMode() === 'mixed') {
      editorManager.activeEditor?.focus();

      return;
    }

    // In the `cell` mode, closing without saving changes no selection, and the grid moves the browser focus
    // to a cell only after a selection change. The focus would stay on the closed editor's hidden field, and
    // a screen reader, which reads what takes the focus, would say nothing.
    const activeElement = getDeepActiveElement(hot.rootDocument);

    if (focusManager.hasBrowserFocus() && isHTMLElement(activeElement) && isInput(activeElement)) {
      focusManager.focusOnHighlightedCell();
    }
  },
};
