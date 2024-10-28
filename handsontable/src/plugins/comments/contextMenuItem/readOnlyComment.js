import * as C from '../../../i18n/constants';
import { checkSelectionConsistency, markLabelAsSelected } from '../../contextMenu/utils';
import { META_READONLY } from '../comments';

/**
 * @param {Comments} plugin The Comments plugin instance.
 * @returns {object}
 */
export default function readOnlyCommentItem(plugin) {
  return {
    key: 'commentsReadOnly',
    name() {
      const label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT);
      const areReadOnly = checkSelectionConsistency(this.getSelectedRange(), (row, col) => {
        return plugin.getCommentMeta(row, col, META_READONLY);
      });

      return areReadOnly ? markLabelAsSelected(label) : label;
    },
    callback() {
      const range = this.getSelectedRangeLast();

      range.forAll((row, column) => {
        if (row >= 0 && column >= 0) {
          const currentState = !!plugin.getCommentMeta(row, column, META_READONLY);

          plugin.updateCommentMeta(row, column, {
            [META_READONLY]: !currentState
          });
        }
      });
    },
    disabled() {
      const range = this.getSelectedRangeLast();

      if (
        !range ||
        range.highlight.isHeader() ||
        !plugin.getCommentAtCell(range.highlight.row, range.highlight.col) ||
        this.selection.isEntireRowSelected() && this.selection.isEntireColumnSelected() ||
        this.countRenderedRows() === 0 || this.countRenderedCols() === 0
      ) {
        return true;
      }

      return false;
    }
  };
}
