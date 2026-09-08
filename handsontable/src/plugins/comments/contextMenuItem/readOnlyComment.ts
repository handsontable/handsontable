import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import { checkSelectionConsistency } from '../../contextMenu/utils';
import { META_READONLY, type Comments } from '../comments';

/**
 * @param {Comments} plugin The Comments plugin instance.
 * @returns {object}
 */
export default function readOnlyCommentItem(plugin: Comments) {
  return {
    key: 'commentsReadOnly',
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY_COMMENT);
    },
    checked(this: HotInstance) {
      return checkSelectionConsistency(this.getSelectedRange() ?? [], (row: number, col: number) => {
        return !!(plugin.getCommentMeta(row, col, META_READONLY));
      });
    },
    callback(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (!range) {
        return;
      }

      range.forAll((row: number, column: number) => {
        if (row >= 0 && column >= 0) {
          const currentState = !!plugin.getCommentMeta(row, column, META_READONLY);

          plugin.updateCommentMeta(row, column, {
            [META_READONLY]: !currentState
          });
        }
      });
    },
    disabled(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (
        !range ||
        range.highlight.isHeader() ||
        !plugin.getCommentAtCell(range.highlight.row!, range.highlight.col!) ||
        this.selection.isEntireRowSelected() && this.selection.isEntireColumnSelected() ||
        this.countRenderedRows() === 0 || this.countRenderedCols() === 0
      ) {
        return true;
      }

      return false;
    }
  };
}
