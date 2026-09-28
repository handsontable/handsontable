import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import { checkSelectionConsistency, getSelectionCheckState } from '../../contextMenu/utils';
import {
  META_COMMENT,
  META_COMMENT_VALUE,
  META_READONLY,
  type CommentObject,
  type Comments,
} from '../comments';

/**
 * Reads whether a cell's comment is read-only, or `null` when the cell does not take part: a hidden
 * cell under a merged block, or a cell holding no comment. Comment meta without a value, which
 * earlier versions of this item's click left on cells without a comment, does not count.
 *
 * Read transiently rather than through `plugin.getCommentMeta()`, which resolves via `getCellMeta`.
 * The mark can walk the whole selection on every menu draw, so the materializing read would retain
 * one meta object per visited cell for the grid's life – the pattern `handsontable/AGENTS.md` bans
 * for a range loop.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @returns {boolean|null}
 */
function getCommentReadOnlyState(hot: HotInstance, row: number, col: number): boolean | null {
  const cellMeta = hot.getCellMetaTransient<{ [META_COMMENT]?: CommentObject; hidden?: boolean }>(row, col);
  const comment = cellMeta[META_COMMENT];

  if (cellMeta.hidden || !comment?.[META_COMMENT_VALUE]) {
    return null;
  }

  return !!comment[META_READONLY];
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

      range.forAll((row: number, column: number) => {
        if (row >= 0 && column >= 0 && getCommentReadOnlyState(this, row, column) !== null) {
          plugin.updateCommentMeta(row, column, {
            [META_READONLY]: !atLeastOneReadOnly
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
