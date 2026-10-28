import { outerWidth } from '../../helpers/dom/element';
import type { HotInstance } from '../../core/types';
import { META_COMMENT, META_COMMENT_VALUE, type CommentObject } from './comments';

/**
 * Get the horizontal anchor width used to place the comments editor.
 *
 * For merged cells, use the rendered TD width (the full merged width) instead of
 * the base column width so the editor opens at the merged cell's right edge.
 *
 * @param {number} metaColspan The colspan value from the cell meta (1 for non-merged cells).
 * @param {HTMLTableCellElement} TD The rendered table cell.
 * @param {number} renderableColumnWidth Width of the renderable column.
 * @returns {number}
 */
export function getEditorAnchorWidth(
  metaColspan: number, TD: HTMLTableCellElement, renderableColumnWidth: number
): number {
  if (metaColspan > 1) {
    return outerWidth(TD);
  }

  return renderableColumnWidth;
}

/**
 * Get the height the comments editor takes when the comment has no saved size.
 *
 * A range that spans more than one row gets the height of its rendered cell, so the editor does not
 * stick out below the range or end short of it. Any other cell keeps the default height.
 *
 * @param {number} rowspan The number of rows the rendered cell spans (1 for non-merged cells).
 * @param {number} cellHeight Height of the rendered table cell.
 * @returns {number | undefined} The height in pixels, or `undefined` when the default applies.
 */
export function getEditorAnchorHeight(rowspan: number, cellHeight: number): number | undefined {
  if (rowspan > 1 && cellHeight > 0) {
    return cellHeight;
  }

  return undefined;
}

/**
 * Checks whether a cell holds a comment the user can act on. A hidden cell under a merged block does
 * not count, and neither does comment meta without a value, which earlier versions of the "Read-only
 * comment" item's click left on cells without a comment.
 *
 * Read transiently rather than through `plugin.getCommentMeta()`, which resolves via `getCellMeta`.
 * The comment menu items walk the whole selection on every menu draw, so the materializing read would
 * retain one meta object per visited cell for the grid's life – the pattern `handsontable/AGENTS.md`
 * bans for a range loop.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @returns {boolean}
 */
export function hasCommentAtCell(hot: HotInstance, row: number, col: number): boolean {
  const cellMeta = hot.getCellMetaTransient<{ [META_COMMENT]?: CommentObject; hidden?: boolean }>(row, col);

  return !cellMeta.hidden && !!cellMeta[META_COMMENT]?.[META_COMMENT_VALUE];
}
