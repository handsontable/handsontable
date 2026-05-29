import * as C from '../../../i18n/constants';
import type { Comments } from '../comments';

/**
 * @param {Comments} plugin The Comments plugin instance.
 * @returns {object}
 */
export default function addEditCommentItem(plugin: Comments) {
  return {
    key: 'commentsAddEdit',
    name(): string {
      const highlight = this.getSelectedRangeActive()?.highlight;

      if (highlight?.isCell() && plugin.getCommentAtCell(highlight.row, highlight.col)) {
        return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_EDIT_COMMENT) as string;
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ADD_COMMENT) as string;
    },
    callback() {
      const range = this.getSelectedRangeActive();

      plugin.setRange(range);
      plugin.show();
      plugin.focusEditor();
    },
    disabled() {
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
