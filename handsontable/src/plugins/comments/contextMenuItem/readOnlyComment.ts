import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import { getSelectionCheckState } from '../../contextMenu/utils';
import {
  META_COMMENT,
  META_COMMENT_VALUE,
  META_READONLY,
  type CommentObject,
  type Comments,
} from '../comments';

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
      return getSelectionCheckState(this.getSelectedRange() ?? [], (row: number, col: number) => {
        // Read transiently rather than through `plugin.getCommentMeta()`, which resolves via
        // `getCellMeta`. This can walk the whole selection on every menu draw, so the materializing
        // read would retain one meta object per visited cell for the grid's life – the pattern
        // `handsontable/AGENTS.md` bans for a range loop.
        const cellMeta = this.getCellMetaTransient<{ [META_COMMENT]?: CommentObject; hidden?: boolean }>(row, col);
        const comment = cellMeta[META_COMMENT];

        // Only a visible cell holding a comment takes part. Comment meta without a value is what
        // this item's own callback leaves on a cell that has no comment.
        if (cellMeta.hidden || !comment?.[META_COMMENT_VALUE]) {
          return null;
        }

        return !!comment[META_READONLY];
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
