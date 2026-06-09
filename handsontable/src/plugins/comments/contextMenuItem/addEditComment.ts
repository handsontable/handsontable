import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';
import type { Comments } from '../comments';

/**
 * @param {Comments} plugin The Comments plugin instance.
 * @returns {object}
 */
export default function addEditCommentItem(plugin: Comments) {
  return {
    key: 'commentsAddEdit',
    name(this: HotInstance): string {
      const highlight = this.getSelectedRangeActive()?.highlight;

      if (highlight?.isCell() && highlight.row !== null && highlight.col !== null &&
          plugin.getCommentAtCell(highlight.row, highlight.col)) {
        return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_EDIT_COMMENT) as string;
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ADD_COMMENT) as string;
    },
    callback(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (range) {
        plugin.setRange({ from: range.from, to: range.to });
      }
      plugin.show();
      plugin.focusEditor();
    },
    disabled(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (
        !range ||
        range.highlight.isHeader() ||
        this.selection.isEntireRowSelected() && this.selection.isEntireColumnSelected() ||
        this.countRenderedRows() === 0 || this.countRenderedCols() === 0
      ) {
        return true;
      }

      return false;
    }
  };
}
