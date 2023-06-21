import * as C from '../../../i18n/constants';

/**
 * @param {Comments} plugin The Comments plugin instance.
 * @returns {object}
 */
export default function addEditCommentItem(plugin) {
  return {
    key: 'commentsAddEdit',
    name() {
      const highlight = this.getSelectedRangeLast()?.highlight;

      if (highlight && highlight.isCell() && plugin.getCommentAtCell(highlight.row, highlight.col)) {
        return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_EDIT_COMMENT);
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ADD_COMMENT);
    },
    callback() {
      const range = this.getSelectedRangeLast();

      this.deselectCell();

      plugin.setRange(range);
      plugin.show();
      plugin.editor.focus();
    },
    disabled() {
      const range = this.getSelectedRangeLast();

      if (!range) {
        return true;
      }

      if (range.highlight.isHeader()) {
        return true;
      }

      return this.countRenderedRows() === 0 || this.countRenderedCols() === 0;
    }
  };
}
