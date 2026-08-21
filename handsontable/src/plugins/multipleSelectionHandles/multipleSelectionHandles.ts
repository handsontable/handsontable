import { eventTargetEl, hasClass } from '../../helpers/dom/element';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { getFirstTouchPoint } from '../../helpers/dom/event';
import { isMobileBrowser } from '../../helpers/browser';
import { BasePlugin } from '../base';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';

export const PLUGIN_KEY = 'multipleSelectionHandles';
export const PLUGIN_PRIORITY = 160;

/**
 * @private
 * @plugin MultipleSelectionHandles
 * @class MultipleSelectionHandles
 */
export class MultipleSelectionHandles extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * @type {Array}
   */
  dragged: string[] = [];
  /**
   * @type {object}
   */
  declare touchStartRange: { width: number; height: number; direction: string } | undefined;
  /**
   * Viewport coordinates of the dragging finger. Kept so the drag can carry on after DragToScroll
   * moves the viewport, when no further `touchmove` arrives.
   */
  #lastTouchPosition: { clientX: number; clientY: number } | null = null;
  /**
   * The cell the selection was last extended to. Guards against redundant `setRangeEnd` calls while
   * the finger moves within one cell.
   */
  #lastTargetCoords: { row: number; col: number } | null = null;

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return isMobileBrowser();
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterScroll', this.#onAfterScroll);
    this.registerListeners();
    super.enablePlugin();
  }

  /**
   * Bind the touch events.
   *
   * @private
   */
  registerListeners() {
    const { rootElement } = this.hot;

    /**
     * @private
     * @param {string} query Query for the position.
     * @returns {boolean}
     */
    const removeFromDragged = (query: string) => {
      this.#lastTouchPosition = null;
      this.#lastTargetCoords = null;

      if (this.dragged.length === 1) {
        // clear array
        this.dragged.splice(0, this.dragged.length);

        return true;
      }

      const entryPosition = this.dragged.indexOf(query);

      if (entryPosition === -1) {
        return false;
      } else if (entryPosition === 0) {
        this.dragged = this.dragged.slice(0, 1);
      } else if (entryPosition === 1) {
        this.dragged = this.dragged.slice(-1);
      }
    };

    this.eventManager.addEventListener(rootElement, 'touchstart', (event) => {
      let selectedRange;
      const target = eventTargetEl(event)!;

      if (hasClass(target, 'topSelectionHandle-HitArea')) {
        selectedRange = this.hot.getSelectedRangeActive();

        if (!selectedRange) {
          return false;
        }

        this.dragged.push('top');

        this.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };

        event.preventDefault();

        return false;

      } else if (hasClass(target, 'bottomSelectionHandle-HitArea')) {
        selectedRange = this.hot.getSelectedRangeActive();

        if (!selectedRange) {
          return false;
        }

        this.dragged.push('bottom');

        this.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };

        event.preventDefault();

        return false;
      }
    });

    this.eventManager.addEventListener(rootElement, 'touchend', (event) => {
      const target = eventTargetEl(event)!;

      // Forget the finger unconditionally, whatever it was released over. The branches below only
      // clear `dragged` for a release on a handle, so without this a leftover position could let a
      // later, unrelated scroll re-extend the selection through `#onAfterScroll`.
      this.#lastTouchPosition = null;
      this.#lastTargetCoords = null;

      if (hasClass(target, 'topSelectionHandle-HitArea')) {
        removeFromDragged('top');

        this.touchStartRange = undefined;

        event.preventDefault();

        return false;

      } else if (hasClass(target, 'bottomSelectionHandle-HitArea')) {
        removeFromDragged('bottom');

        this.touchStartRange = undefined;

        event.preventDefault();

        return false;
      }
    });

    this.eventManager.addEventListener(rootElement, 'touchmove', (event) => {
      if (this.dragged.length === 0) {
        return;
      }

      const touch = getFirstTouchPoint(event);

      if (touch === null) {
        return;
      }

      this.#lastTouchPosition = touch;

      this.#extendSelection(touch.clientX, touch.clientY);

      event.preventDefault();
    });
  }

  /**
   * Calculates the new selection range coordinates after dragging a touch handle, accounting for drag direction and handle position.
   */
  getCurrentRangeCoords(
    selectedRange: CellRange, currentTouch: CellCoords, touchStartDirection: string,
    currentDirection: string, draggedHandle: string
  ) {
    const topStartCorner = selectedRange.getTopStartCorner();
    const bottomEndCorner = selectedRange.getBottomEndCorner();
    const bottomStartCorner = selectedRange.getBottomStartCorner();
    const topEndCorner = selectedRange.getTopEndCorner();

    let newCoords = {
      start: null as CellCoords | null,
      end: null as CellCoords | null
    };

    switch (touchStartDirection) {
      case 'NE-SW':
        switch (currentDirection) {
          case 'NE-SW':
          case 'NW-SE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row ?? 0, selectedRange.highlight.col ?? 0),
                end: this.hot._createCellCoords(bottomStartCorner.row ?? 0, currentTouch.col ?? 0)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(selectedRange.highlight.row ?? 0, currentTouch.col ?? 0),
                end: this.hot._createCellCoords(currentTouch.row ?? 0, topStartCorner.col ?? 0)
              };
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'bottom') {
              newCoords = {
                start: this.hot._createCellCoords(bottomEndCorner.row ?? 0, currentTouch.col ?? 0),
                end: this.hot._createCellCoords(currentTouch.row ?? 0, topStartCorner.col ?? 0)
              };
            }
            break;
          default:
            break;
        }
        break;
      case 'NW-SE':
        switch (currentDirection) {
          case 'NE-SW':
            if (draggedHandle === 'top') {
              newCoords = {
                start: currentTouch,
                end: bottomStartCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'NW-SE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: currentTouch,
                end: bottomEndCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'top') {
              newCoords = {
                start: currentTouch,
                end: topStartCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          case 'SW-NE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: currentTouch,
                end: topEndCorner
              };
            } else {
              newCoords.end = currentTouch;
            }
            break;
          default:
            break;
        }
        break;
      case 'SW-NE':
        switch (currentDirection) {
          case 'NW-SE':
            if (draggedHandle === 'bottom') {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row ?? 0, topStartCorner.col ?? 0),
                end: this.hot._createCellCoords(bottomStartCorner.row ?? 0, currentTouch.col ?? 0)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(topStartCorner.row ?? 0, currentTouch.col ?? 0),
                end: this.hot._createCellCoords(currentTouch.row ?? 0, bottomEndCorner.col ?? 0)
              };
            }
            break;
          // case 'NE-SW':
          //
          //  break;
          case 'SW-NE':
            if (draggedHandle === 'top') {
              newCoords = {
                start: this.hot._createCellCoords(selectedRange.highlight.row ?? 0, currentTouch.col ?? 0),
                end: this.hot._createCellCoords(currentTouch.row ?? 0, bottomEndCorner.col ?? 0)
              };
            } else {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row ?? 0, topStartCorner.col ?? 0),
                end: this.hot._createCellCoords(topStartCorner.row ?? 0, currentTouch.col ?? 0)
              };
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'bottom') {
              newCoords = {
                start: this.hot._createCellCoords(currentTouch.row ?? 0, topEndCorner.col ?? 0),
                end: this.hot._createCellCoords(topStartCorner.row ?? 0, currentTouch.col ?? 0)
              };
            } else if (draggedHandle === 'top') {
              newCoords = {
                start: bottomStartCorner,
                end: currentTouch
              };
            }
            break;
          default:
            break;
        }
        break;
      case 'SE-NW':
        switch (currentDirection) {
          case 'NW-SE':
          case 'NE-SW':
          case 'SW-NE':
            if (draggedHandle === 'top') {
              newCoords.end = currentTouch;
            }
            break;
          case 'SE-NW':
            if (draggedHandle === 'top') {
              newCoords.end = currentTouch;
            } else {
              newCoords = {
                start: currentTouch,
                end: topStartCorner
              };
            }
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }

    return newCoords;
  }

  /**
   * Check if user is currently dragging the handle.
   *
   * @returns {boolean} Dragging state.
   */
  isDragged(): boolean {
    return this.dragged.length > 0;
  }

  /**
   * Carries the drag on after DragToScroll moves the viewport.
   *
   * A finger held still past the grid edge produces no further `touchmove`, so without this the
   * selection would stop growing at the last cell that was on screen when the finger got there.
   */
  #onAfterScroll = (): void => {
    if (this.dragged.length === 0 || this.#lastTouchPosition === null) {
      return;
    }

    const { clientX, clientY } = this.#lastTouchPosition;

    this.#extendSelection(clientX, clientY);
  };

  /**
   * Extends the selected range to the cell under the given viewport position.
   *
   * The position is resolved with `getCellCoordsFromMousePosition`, which clamps it to the viewport
   * and returns the nearest cell. That is what lets a finger dragged past the grid edge keep
   * extending the selection while DragToScroll scrolls the viewport underneath it.
   *
   * @param {number} clientX The finger's viewport X coordinate.
   * @param {number} clientY The finger's viewport Y coordinate.
   */
  #extendSelection(clientX: number, clientY: number): void {
    const selectedRange = this.hot.getSelectedRangeActive();

    if (!selectedRange || this.touchStartRange === undefined) {
      return;
    }

    const targetCoords = getCellCoordsFromMousePosition(this.hot, clientX, clientY);

    // A position over the row header resolves to column -1; treat it as the first column.
    const targetRow = Math.max(targetCoords.row ?? 0, 0);
    const targetCol = Math.max(targetCoords.col ?? 0, 0);

    // Compare coordinates rather than the resolved cell element: Walkontable reuses the same `td`
    // elements across scrolls, so the element under a stationary finger stays identical while the
    // cell it represents changes on every scroll tick.
    if (this.#lastTargetCoords?.row === targetRow && this.#lastTargetCoords?.col === targetCol) {
      return;
    }

    this.#lastTargetCoords = { row: targetRow, col: targetCol };

    const target = this.hot._createCellCoords(targetRow, targetCol);
    // Read before the `setRangeEnd` below, which mutates the range: the direction that matters is
    // the one the range had on entry.
    const rangeDirection = selectedRange.getDirection();

    if (selectedRange.getWidth() === 1 && selectedRange.getHeight() === 1) {
      this.hot.selection.setRangeEnd(target);
    }

    const newRangeCoords = this.getCurrentRangeCoords(
      selectedRange,
      target,
      this.touchStartRange.direction,
      rangeDirection,
      this.dragged[0]
    );

    if (newRangeCoords.start !== null) {
      this.hot.selection.setRangeStart(newRangeCoords.start);
    }

    if (newRangeCoords.end !== null) {
      this.hot.selection.setRangeEnd(newRangeCoords.end);
    }
  }
}
