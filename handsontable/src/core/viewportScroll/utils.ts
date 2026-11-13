import type { HotInstance } from '../types';
import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';
import { isHTMLElement } from '../../helpers/dom/element';

/**
 * Scrolls the browser's viewport to the specified element.
 *
 * @param {HTMLElement} element The element to scroll.
 */
export function scrollWindowToCell(element: HTMLElement | null) {
  if (isHTMLElement(element)) {
    element.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }
}

/**
 * The scroll offset of the grid's viewport on both axes, as its scroll owners report it.
 */
interface ViewportOffset {
  top: number;
  left: number;
}

/**
 * The scroll offsets of one element, as read before a `scrollIntoView()` call.
 */
interface ElementScrollOffsets {
  element: HTMLElement;
  top: number;
  left: number;
}

/**
 * The `scrollViewportTo()` options a scroll strategy passes.
 */
type ScrollTarget = Parameters<HotInstance['scrollViewportTo']>[0];

/**
 * Scrolls the viewport to the target and then, once that scroll is drawn, the browser window to the element
 * `getWindowTarget` returns (the selected cell or header).
 *
 * `scrollViewportTo()` runs that second step on the next `afterScroll`, which the holder's `scroll` event fires
 * a frame later, not the synchronous render. When the viewport moves again in between - an application that
 * selects a cell and scrolls the grid in the same task, or a command such as Shift+PageDown that scrolls
 * again after `setRangeEnd()` - the `afterScroll` belongs to the later scroll. `scrollIntoView()` then pulled
 * the grid back to the selected cell: directly, or through a frozen overlay's holder that
 * `NativeScrollInput#onCloneScroll` replays onto the master. So in that case the window still scrolls to the
 * element, but every scroll offset inside the grid's container is put back afterwards. When the viewport did
 * not move, `scrollIntoView()` runs untouched: its adjustment of the grid's own holder finishes revealing a
 * clicked merged cell and a partly shown cell of a nested list.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {object} target The `scrollViewportTo()` options.
 * @param {Function} [getWindowTarget] Returns the element to scroll the window to, read after the scroll.
 */
export function scrollViewportThenWindow(
  hot: HotInstance,
  target: ScrollTarget,
  getWindowTarget?: () => HTMLElement | null,
) {
  if (!getWindowTarget) {
    hot.scrollViewportTo(target);

    return;
  }

  let offsetAfterScroll: ViewportOffset | null = null;

  hot.scrollViewportTo(target, () => {
    const element = getWindowTarget();

    if (offsetAfterScroll !== null && hasViewportMovedFrom(hot, offsetAfterScroll)) {
      scrollWindowToCellKeepingGridScroll(hot, element);
    } else {
      scrollWindowToCell(element);
    }
  });

  offsetAfterScroll = readViewportOffset(hot);
}

/**
 * Reads the viewport's scroll offset.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {ViewportOffset}
 */
function readViewportOffset(hot: HotInstance): ViewportOffset {
  const { wtOverlays } = hot.view._wt;

  return {
    top: wtOverlays.topOverlay.getScrollPosition(),
    left: wtOverlays.inlineStartOverlay.getScrollPosition(),
  };
}

/**
 * Whether the viewport's scroll offset differs from the given one by a pixel or more on either axis. A zoomed
 * page stores a fraction of a pixel for an integer write, and that is not a scroll.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {ViewportOffset} offset The offset to compare with.
 * @returns {boolean}
 */
function hasViewportMovedFrom(hot: HotInstance, offset: ViewportOffset): boolean {
  const { top, left } = readViewportOffset(hot);

  return Math.abs(top - offset.top) >= 1 || Math.abs(left - offset.left) >= 1;
}

/**
 * Scrolls the browser window, and any scrollable element of the page around the grid, to the element, and
 * leaves every scroll offset inside the grid's container (`rootContainer`) where it was. The offsets are
 * written back in the same task, before any scroll listener can read the moved values.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {HTMLElement} element The element to scroll the window to.
 */
function scrollWindowToCellKeepingGridScroll(hot: HotInstance, element: HTMLElement | null) {
  if (!isHTMLElement(element)) {
    return;
  }

  const gridOffsets = readOffsetsUpTo(element, hot.rootContainer);

  scrollWindowToCell(element);

  gridOffsets.forEach(({ element: ancestor, top, left }) => {
    if (ancestor.scrollTop !== top) {
      ancestor.scrollTop = top;
    }
    if (ancestor.scrollLeft !== left) {
      ancestor.scrollLeft = left;
    }
  });
}

/**
 * Reads the scroll offsets of every ancestor of the element below the boundary. The boundary itself is left
 * out: it is the container the application handed to the grid, and scrolling it is the application's call.
 * Returns nothing when the element is not inside the boundary.
 *
 * @param {HTMLElement} element The element whose ancestors are read.
 * @param {HTMLElement} boundary The element the walk stops at.
 * @returns {ElementScrollOffsets[]}
 */
function readOffsetsUpTo(element: HTMLElement, boundary: HTMLElement): ElementScrollOffsets[] {
  const offsets: ElementScrollOffsets[] = [];

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
