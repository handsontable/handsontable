import type { HotInstance } from '../types';
import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';
import { isHTMLElement } from '../../helpers/dom/element';

/**
 * The scroll offsets of one element, as read before a `scrollIntoView()` call.
 */
interface ScrollOffsets {
  element: HTMLElement;
  top: number;
  left: number;
}

/**
 * Scrolls the browser's viewport, and any scrollable element of the page around the grid, so that the
 * specified cell is in view.
 *
 * `scrollIntoView()` moves every scrollable ancestor of the element, and that includes the grid's own
 * holders: the master's and each frozen overlay's. The engine positions those with `scrollViewportTo()`,
 * which knows about the frozen panes and headers painted over them, and `scrollIntoView()` does not. It
 * scrolled a selected cell wider than the viewport under the row headers. And because the selection runs
 * this on the next `afterScroll`, not on the one its own scroll fires, it pulled a scroll made right after
 * the selection back to the selected cell (a frozen overlay's holder moved this way is also replayed onto
 * the master as a user scroll). So every scroll offset inside the grid's container is put back in the same
 * task, before any scroll listener can read the moved value.
 *
 * @param {Core} hot The Handsontable instance the element belongs to.
 * @param {HTMLElement} element The element to scroll into view.
 */
export function scrollWindowToCell(hot: HotInstance, element: HTMLElement | null) {
  if (!isHTMLElement(element)) {
    return;
  }

  const gridOffsets = readOffsetsUpTo(element, hot.rootContainer);

  element.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  });

  restoreOffsets(gridOffsets);
}

/**
 * Reads the scroll offsets of every ancestor of the element below the boundary. The boundary itself is
 * left out: it is the container the application handed to the grid, and scrolling it is the application's
 * call. Returns nothing when the element is not inside the boundary.
 *
 * @param {HTMLElement} element The element whose ancestors are read.
 * @param {HTMLElement} boundary The element the walk stops at.
 * @returns {ScrollOffsets[]}
 */
function readOffsetsUpTo(element: HTMLElement, boundary: HTMLElement): ScrollOffsets[] {
  const offsets: ScrollOffsets[] = [];

  if (!boundary.contains(element)) {
    return offsets;
  }

  let ancestor = element.parentElement;

  while (ancestor !== null && ancestor !== boundary) {
    offsets.push({ element: ancestor, top: ancestor.scrollTop, left: ancestor.scrollLeft });
    ancestor = ancestor.parentElement;
  }

  return offsets;
}

/**
 * Writes back every offset that changed since it was read.
 *
 * @param {ScrollOffsets[]} offsets The offsets read by `readOffsetsUpTo()`.
 */
function restoreOffsets(offsets: ScrollOffsets[]) {
  offsets.forEach(({ element, top, left }) => {
    if (element.scrollTop !== top) {
      element.scrollTop = top;
    }
    if (element.scrollLeft !== left) {
      element.scrollLeft = left;
    }
  });
}

/**
 * Creates a scroll target calculator that calculates the target row and column best viewport
 * scroll position based on the current selection.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {{ getComputedColumnTarget: Function, getComputedRowTarget: Function }}
 */
export function createScrollTargetCalculator(hotInstance: HotInstance) {
  const { selection, view } = hotInstance;
  const cellRange = hotInstance.getSelectedRangeActive();
  const source = selection.getSelectionSource();

  const firstVisibleColumn = view.getFirstFullyVisibleColumn() ?? -1;
  const lastVisibleColumn = view.getLastFullyVisibleColumn() ?? -1;
  const selectionFirstColumn = cellRange?.getTopStartCorner().col ?? -1;
  const selectionLastColumn = cellRange?.getBottomEndCorner().col ?? -1;
  const isSelectionOutsideStartViewport = selectionFirstColumn <= firstVisibleColumn;
  const isSelectionOutsideEndViewport = selectionLastColumn >= lastVisibleColumn;

  const firstVisibleRow = view.getFirstFullyVisibleRow() ?? -1;
  const lastVisibleRow = view.getLastFullyVisibleRow() ?? -1;
  const selectionFirstRow = cellRange?.getTopStartCorner().row ?? -1;
  const selectionLastRow = cellRange?.getBottomEndCorner().row ?? -1;
  const isSelectionOutsideTopViewport = selectionFirstRow <= firstVisibleRow;
  const isSelectionOutsideBottomViewport = selectionLastRow >= lastVisibleRow;

  return {
    /**
     * Calculates the target column for scrolling.
     *
     * @param {CellCoords} lastSelectionCoords The last selection coordinates.
     * @returns {number}
     */
    getComputedColumnTarget(lastSelectionCoords: CellCoords) {
      if (source === 'mouse' || source === 'keyboard') {
        // For mouse or keyboard selection, always scroll to the last column
        // defined by the last selection coords
        return lastSelectionCoords.col ?? -1;
      }

      if (isSelectionOutsideStartViewport && isSelectionOutsideEndViewport) {
        // If the selection is outside both ends of the viewport, scroll to the
        // column where the focused cell is located
        return cellRange?.highlight.col ?? -1;
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
      return lastSelectionCoords.col ?? -1;
    },

    /**
     * Calculates the target row for scrolling.
     *
     * @param {CellCoords} lastSelectionCoords The last selection coordinates.
     * @returns {number}
     */
    getComputedRowTarget(lastSelectionCoords: CellCoords) {
      if (source === 'mouse' || source === 'keyboard') {
        // For mouse or keyboard selection, always scroll to the last row
        // defined by the coords
        return lastSelectionCoords.row ?? -1;
      }

      if (isSelectionOutsideTopViewport && isSelectionOutsideBottomViewport) {
        // If the selection is outside both ends of the viewport, scroll to the
        // row where the focused cell is located
        return cellRange?.highlight.row ?? -1;
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
      return lastSelectionCoords.row ?? -1;
    },
  };
}
