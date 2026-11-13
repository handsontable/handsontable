import { outerWidth } from '../../helpers/dom/element';
import type { HotInstance } from '../../core/types';
import { META_COMMENT, META_COMMENT_VALUE, type CommentObject } from './constants';

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
 * Get how far the top edge of the active selection border reaches above a cell's own top edge.
 *
 * The border is drawn around the active highlight, `0` to a pixel outside the cell's box: the border moves back onto
 * the cell's top edge under a column header, on a cell that draws its own top border, and under an overlay. Reading
 * the drawn border instead of repeating those conditions keeps the editor flush with what the user sees. It answers
 * `0` when the cell is not the active highlight (a comment opened by a hover, or a selection elsewhere).
 *
 * @param {HTMLTableCellElement} TD The rendered table cell the editor is anchored to.
 * @param {number} maxOverhang The most, in pixels, the answer can be.
 * @returns {number} The gap in pixels, from `0` to `maxOverhang`.
 */
export function getSelectionBorderOverhang(TD: HTMLTableCellElement, maxOverhang: number): number {
  // The borders of a table sit in one holder, next to its `table` in the spreader. The focus highlight is the
  // only `current` border, and its corner handle is not part of its edge.
  const edges = TD.closest('.wtSpreader')
    ?.querySelector(':scope > .htBorders')
    ?.querySelectorAll('.wtBorder.current:not(.corner)');

  if (!edges || edges.length === 0) {
    return 0;
  }

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  edges.forEach((edge) => {
    const rect = edge.getBoundingClientRect();

    // A hidden edge has no box.
    if (rect.width > 0 && rect.height > 0) {
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }
  });

  const cell = TD.getBoundingClientRect();
  const centerX = cell.left + (cell.width / 2);
  const centerY = cell.top + (cell.height / 2);

  // The border of another cell (or of none) is not this cell's.
  if (centerX < left || centerX > right || centerY < top || centerY > bottom) {
    return 0;
  }

  return Math.min(Math.max(cell.top - top, 0), maxOverhang);
}

/**
 * The cell meta fields the comment menu items read.
 */
export type CommentCellMeta = { [META_COMMENT]?: CommentObject; hidden?: boolean };

/**
 * Checks whether a cell's meta holds a comment the user can act on. A hidden cell under a merged block
 * does not count, and neither does comment meta without a value, which earlier versions of the
 * "Read-only comment" item's click left on cells without a comment.
 *
 * @param {object} cellMeta The cell meta.
 * @returns {boolean}
 */
export function hasCommentInMeta(cellMeta: CommentCellMeta): boolean {
  return !cellMeta.hidden && !!cellMeta[META_COMMENT]?.[META_COMMENT_VALUE];
}

/**
 * Checks whether a cell holds a comment the user can act on (see `hasCommentInMeta()`).
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
  return hasCommentInMeta(hot.getCellMetaTransient<CommentCellMeta>(row, col));
}
