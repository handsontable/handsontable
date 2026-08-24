import * as C from '../../../i18n/constants';
import type { Comments } from '../comments';
import type { HotInstance } from '../../../core/types';

/**
 * @param {Comments} plugin The Comments plugin instance.
 * @returns {object}
 */
export default function removeCommentItem(plugin: Comments) {
  return {
    key: 'commentsRemove',
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_COMMENT);
    },
    callback(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (!range) {
        return;
      }

      range.forAll((row: number, column: number) => {
        if (row >= 0 && column >= 0) {
          plugin.removeCommentAtCell(row, column, false);
        }
      });

      this.render();
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
