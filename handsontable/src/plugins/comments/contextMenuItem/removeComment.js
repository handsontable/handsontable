import * as C from '../../../i18n/constants';

/**
 * @param {Comments} plugin The Comments plugin instance.
 * @returns {object}
 */
export default function removeCommentItem(plugin) {
  return {
    key: 'commentsRemove',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_COMMENT);
    },
    callback() {
      const range = this.getSelectedRangeLast();

      range.forAll((row, column) => {
        if (row >= 0 && column >= 0) {
          plugin.removeCommentAtCell(row, column, false);
        }
      });

      this.render();
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
