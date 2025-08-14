import { isHTMLElement } from '../../helpers/dom/element';

/**
 * Scrolls the browser's viewport to the specified element.
 *
 * @param {HTMLElement} element The element to scroll.
 */
export function scrollWindowToCell(element) {
  if (isHTMLElement(element)) {
    element.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }
}

/**
 * Creates a scroll target calculator that calculates the target row and column best viewport
 * scroll position based on the current selection.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {{ getComputedColumnTarget: Function, getComputedRowTarget: Function }}
 */
export function createScrollTargetCalculator(hotInstance) {
  const { selection, view } = hotInstance;
  const cellRange = hotInstance.getSelectedRangeActive();
  const source = selection.getSelectionSource();

  const firstVisibleColumn = view.getFirstFullyVisibleColumn();
  const lastVisibleColumn = view.getLastFullyVisibleColumn();
  const selectionFirstColumn = cellRange.getTopStartCorner().col;
  const selectionLastColumn = cellRange.getBottomEndCorner().col;
  const isSelectionOutsideStartViewport = selectionFirstColumn <= firstVisibleColumn;
  const isSelectionOutsideEndViewport = selectionLastColumn >= lastVisibleColumn;

  const firstVisibleRow = view.getFirstFullyVisibleRow();
  const lastVisibleRow = view.getLastFullyVisibleRow();
  const selectionFirstRow = cellRange.getTopStartCorner().row;
  const selectionLastRow = cellRange.getBottomEndCorner().row;
  const isSelectionOutsideTopViewport = selectionFirstRow <= firstVisibleRow;
  const isSelectionOutsideBottomViewport = selectionLastRow >= lastVisibleRow;

  return {
    /**
     * Calculates the target column for scrolling.
     *
     * @param {CellCoords} lastSelectionCoords The last selection coordinates.
     * @returns {number}
     */
    getComputedColumnTarget(lastSelectionCoords) {
      if (source === 'mouse' || source === 'keyboard') {
        // For mouse or keyboard selection, always scroll to the last column
        // defined by the last selection coords
        return lastSelectionCoords.col;
      }

      if (isSelectionOutsideStartViewport && isSelectionOutsideEndViewport) {
        // If the selection is outside both ends of the viewport, scroll to the
        // column where the focused cell is located
        return cellRange.highlight.col;
      }

      if (isSelectionOutsideStartViewport) {
        // If the selection is outside the start (left) of the viewport, scroll to
        // the first column of the selection range
        return selectionFirstColumn;
      }

      if (isSelectionOutsideEndViewport) {
        // If the selection is outside the end (right) of the viewport, scroll to
        // the last column of the selection range
        return selectionLastColumn;
      }

      // For other cases, scroll to the column defined by the last selection coords
      return lastSelectionCoords.col;
    },

    /**
     * Calculates the target row for scrolling.
     *
     * @param {CellCoords} lastSelectionCoords The last selection coordinates.
     * @returns {number}
     */
    getComputedRowTarget(lastSelectionCoords) {
      if (source === 'mouse' || source === 'keyboard') {
        // For mouse or keyboard selection, always scroll to the last row
        // defined by the coords
        return lastSelectionCoords.row;
      }

      if (isSelectionOutsideTopViewport && isSelectionOutsideBottomViewport) {
        // If the selection is outside both ends of the viewport, scroll to the
        // row where the focused cell is located
        return cellRange.highlight.row;
      }

      if (isSelectionOutsideTopViewport) {
        // If the selection is outside the top of the viewport, scroll to
        // the first row of the selection range
        return selectionFirstRow;
      }

      if (isSelectionOutsideBottomViewport) {
        // If the selection is outside the bottom of the viewport, scroll to
        // the last row of the selection range
        return selectionLastRow;
      }

      // For other cases, scroll to the row defined by the last selection coords
      return lastSelectionCoords.row;
    },
  };
}
