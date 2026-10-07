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
 * The `scrollViewportTo()` options a scroll strategy passes.
 */
type ScrollTarget = Parameters<HotInstance['scrollViewportTo']>[0];

/**
 * Scrolls the viewport to the target, then runs `scrollWindow` (the strategy's `scrollWindowToCell()` call)
 * once that scroll is drawn - unless the viewport has moved again since.
 *
 * `scrollViewportTo()` runs the callback on the next `afterScroll`, which the holder's `scroll` event fires a
 * frame later, not the synchronous render. When the viewport moves again in between (an application that
 * selects a cell and scrolls the grid in the same task), that `afterScroll` belongs to the later scroll, and
 * `scrollIntoView()` pulled the grid back to the selected cell - directly, or through a frozen overlay's
 * holder that `NativeScrollInput#onCloneScroll` replays onto the master. The later scroll is the one the
 * viewport keeps, so the window scroll is dropped then. Otherwise it runs as before, holder adjustments
 * included: a merged cell and a partly shown cell of a nested list rely on them.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {object} target The `scrollViewportTo()` options.
 * @param {Function} [scrollWindow] The window scroll to run after the viewport scroll.
 */
export function scrollViewportThenWindow(hot: HotInstance, target: ScrollTarget, scrollWindow?: () => void) {
  if (!scrollWindow) {
    hot.scrollViewportTo(target);

    return;
  }

  let offsetAfterScroll: ViewportOffset | null = null;

  hot.scrollViewportTo(target, () => {
    if (offsetAfterScroll === null || !hasViewportMovedFrom(hot, offsetAfterScroll)) {
      scrollWindow();
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
    top: wtOverlays.topOverlay?.getScrollPosition() ?? 0,
    left: wtOverlays.inlineStartOverlay?.getScrollPosition() ?? 0,
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
