/**
 * Get the fill handle border range.
 *
 * @returns {CellRange}
 */
export function getFillHandleBorderRange() {
  return selection().highlight.getFill().visualCellRange;
}
