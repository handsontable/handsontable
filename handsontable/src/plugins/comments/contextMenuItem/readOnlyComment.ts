import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import { checkSelectionConsistency, getSelectionCheckState } from '../../contextMenu/utils';
import { hasCommentAtCell } from '../utils';
import {
  META_COMMENT,
  META_READONLY,
  type CommentObject,
  type Comments,
} from '../comments';

/**
 * Reads whether a cell's comment is read-only, or `null` when the cell does not take part: a hidden
 * cell under a merged block, or a cell holding no comment (see `hasCommentAtCell()`).
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @returns {boolean|null}
 */
function getCommentReadOnlyState(hot: HotInstance, row: number, col: number): boolean | null {
  if (!hasCommentAtCell(hot, row, col)) {
    return null;
  }

  return !!hot.getCellMetaTransient<{ [META_COMMENT]?: CommentObject }>(row, col)[META_COMMENT]?.[META_READONLY];
}

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
      return getSelectionCheckState(
        this.getSelectedRange() ?? [],
        (row: number, col: number) => getCommentReadOnlyState(this, row, col)
      );
    },
    callback(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (!range) {
        return;
      }

      // One state for every comment, as `make_read_only` does, so a mixed mark clears on click: any
      // read-only comment makes them all writable, otherwise they all become read-only.
      const atLeastOneReadOnly = checkSelectionConsistency(
        [range],
        (row: number, col: number) => getCommentReadOnlyState(this, row, col) === true
      );

      // Every cell's change is one undo step together.
      plugin.runOperation('comment', () => range.forAll((row: number, column: number) => {
        if (row >= 0 && column >= 0 && getCommentReadOnlyState(this, row, column) !== null) {
          plugin.updateCommentMeta(row, column, {
            [META_READONLY]: !atLeastOneReadOnly
          });
        }
      }));
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

      // The callback toggles every comment in the range, so the item stays available while any
      // cell in it has one, not only the highlighted cell.
      return !checkSelectionConsistency([range], (row: number, col: number) => hasCommentAtCell(this, row, col));
    }
  };
}
