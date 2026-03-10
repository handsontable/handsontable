import { outerWidth } from '../../helpers/dom/element';

/**
 * Get the horizontal anchor width used to place the comments editor.
 *
 * For merged cells, use the rendered TD width (the full merged width) instead of
 * the base column width so the editor opens at the merged cell's right edge.
 *
 * @param {HTMLTableCellElement} TD The rendered table cell.
 * @param {number} renderableColumnWidth Width of the renderable column.
 * @returns {number}
 */
export function getEditorAnchorWidth(TD, renderableColumnWidth) {
  if (TD?.colSpan > 1) {
    return outerWidth(TD);
  }

  return renderableColumnWidth;
}
