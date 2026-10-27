import { outerWidth } from '../../helpers/dom/element';

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
 * @param {number} metaRowspan The rowspan value from the cell meta (1 for non-merged cells).
 * @param {number} cellHeight Height of the rendered table cell.
 * @returns {number | undefined} The height in pixels, or `undefined` when the default applies.
 */
export function getEditorAnchorHeight(metaRowspan: number, cellHeight: number): number | undefined {
  if (metaRowspan > 1 && cellHeight > 0) {
    return cellHeight;
  }

  return undefined;
}
