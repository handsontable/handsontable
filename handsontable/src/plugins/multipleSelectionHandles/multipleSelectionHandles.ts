import { addClass, eventTargetEl, hasClass, removeClass } from '../../helpers/dom/element';
import { armPick, type ArmedPick } from '../../utils/armedPick';
import { announce } from '../../utils/a11yAnnouncer';
import * as C from '../../i18n/constants';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { getFirstChangedTouch, getTouchPointById } from '../../helpers/dom/event';
import { isMobileOrIpadOS } from '../../helpers/browser';
import { BasePlugin } from '../base';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';

export const PLUGIN_KEY = 'multipleSelectionHandles';
export const PLUGIN_PRIORITY = 160;

/**
 * How far the finger must travel, in pixels, before its position is resolved to a cell again.
 */
const TOUCH_MOVE_THRESHOLD = 2;

/**
 * How far the finger on a handle may travel, in pixels, and still be a tap. A tap on a handle arms the "click, then
 * click" way to move the edge.
 */
const TAP_THRESHOLD = 6;

const HANDLE_HIT_AREA_SELECTOR = '.topSelectionHandle-HitArea, .bottomSelectionHandle-HitArea';

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
   * Which handle each finger currently holding one grabbed, keyed by `Touch.identifier`. Lets a
   * touch event be matched to the finger it is about, rather than to whatever else is on the screen.
   */
  #dragTouches: Map<number, string> = new Map();
  /**
   * Where each finger that grabbed a handle touched down, and whether it has moved since, keyed by `Touch.identifier`.
   * A finger that lifts without having moved tapped the handle.
   */
  #presses: Map<number, { startX: number; startY: number; moved: boolean; onArmedHandle: boolean }> = new Map();
  /**
   * The "click, then click" gesture in progress: a tap on a handle armed it, and the next tap on the grid picks where
   * the corner goes.
   */
  #pick: ArmedPick | null = null;
  /**
   * The handle that armed the pick in progress.
   */
  #pickHandle: string | null = null;

  /**
   * Check if the plugin is enabled. There is no setting: the plugin turns on for a mobile
   * user-agent and for iPadOS that reports a desktop Macintosh UA (iPadOS 13+).
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return isMobileOrIpadOS();
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterScroll', this.#onAfterScroll);
    this.addHook('afterSelection', this.#onAfterSelection);
    this.registerListeners();
    super.enablePlugin();
  }

  /**
   * Disables the plugin and forgets any drag in progress.
   *
   * Without the reset, an `updateSettings()` mid-drag would take the listeners away while
   * `#dragTouches` still reported a drag - and because browsers recycle `Touch.identifier`, a later
   * unrelated finger handed a stale id would pass `isDraggedBy()` and start scrolling the grid.
   */
  disablePlugin() {
    this.#pick?.cancel();
    this.#resetDrag();

    super.disablePlugin();
  }

  /**
   * Destroys the plugin. A pick that waits for a tap listens on the document, so it has to end here too, or it would
   * outlive the grid and swallow the page's own presses.
   */
  destroy() {
    this.#pick?.cancel();
    this.#resetDrag();

    super.destroy();
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
      }

      // Both former branches sliced the array so that the handle being removed was the one KEPT, so
      // with two handles held the survivor drove the rest of the drag through `this.dragged[0]` and
      // moved the wrong corner of the range.
      this.dragged.splice(entryPosition, 1);
    };

    /**
     * Starts tracking one finger's grip on a handle. Refuses when the finger carries no identifier,
     * because an untracked finger could never be released - the drag would look stuck for good.
     *
     * @private
     * @param {Event} event The `touchstart` event.
     * @param {string} handle Which handle the finger grabbed.
     * @returns {boolean} `true` when the drag started.
     */
    const beginDrag = (event: Event, handle: string) => {
      const touch = getFirstChangedTouch(event);

      if (touch === null) {
        return false;
      }

      this.#dragTouches.set(touch.identifier, handle);
      this.dragged.push(handle);
      this.#presses.set(touch.identifier, {
        startX: touch.clientX,
        startY: touch.clientY,
        moved: false,
        // a tap on the handle that armed a pick ends it, and must not arm it again
        onArmedHandle: this.#pick !== null && this.#pickHandle === handle,
      });
      this.#pick?.cancel();

      return true;
    };

    /**
     * Ends the part of the drag owned by every finger that has left the screen, and leaves the rest
     * of the gesture running. `touchend` and `touchcancel` both fire once per finger, so neither is
     * a statement about the gesture as a whole.
     *
     * @private
     * @param {Event} event The `touchend` or `touchcancel` event.
     */
    const releaseLiftedTouches = (event: Event) => {
      let released = false;
      let tappedHandle: string | null = null;
      const startRange = this.touchStartRange;

      for (const [identifier, handle] of [...this.#dragTouches]) {
        if (getTouchPointById(event, identifier) === null) {
          const press = this.#presses.get(identifier);

          // a finger that did not move tapped the handle, unless the system took the touch away
          if (press && !press.moved && !press.onArmedHandle && event.type !== 'touchcancel') {
            tappedHandle = handle;
          }

          this.#presses.delete(identifier);
          this.#dragTouches.delete(identifier);
          removeFromDragged(handle);
          released = true;
        }
      }

      if (!released) {
        return;
      }

      this.#lastTouchPosition = null;
      this.#lastTargetCoords = null;

      if (this.dragged.length === 0) {
        this.touchStartRange = undefined;
      }

      if (tappedHandle !== null && startRange !== undefined) {
        this.#startPick(tappedHandle, startRange);
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

        if (!beginDrag(event, 'top')) {
          return false;
        }

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

        if (!beginDrag(event, 'bottom')) {
          return false;
        }

        this.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };

        event.preventDefault();

        return false;
      }
    });

    // A canceled gesture never reaches `touchend`, and browsers cancel often on a real phone - a
    // system gesture, an incoming call, the browser claiming the touch for scrolling. Both events are
    // handled the same way, because both answer the same question: which fingers are gone?
    for (const eventName of ['touchend', 'touchcancel']) {
      this.eventManager.addEventListener(rootElement, eventName, (event) => {
        const target = eventTargetEl(event)!;

        releaseLiftedTouches(event);

        if (hasClass(target, 'topSelectionHandle-HitArea') ||
            hasClass(target, 'bottomSelectionHandle-HitArea')) {
          event.preventDefault();

          return false;
        }
      });
    }

    this.eventManager.addEventListener(rootElement, 'touchmove', (event) => {
      if (this.dragged.length === 0) {
        return;
      }

      const point = this.#getDragTouchPoint(event);

      if (point === null) {
        return;
      }

      // each finger is measured from where it touched down, by its own identifier
      this.#presses.forEach((press, identifier) => {
        const touchPoint = getTouchPointById(event, identifier);

        if (!press.moved && touchPoint !== null
          && Math.hypot(touchPoint.clientX - press.startX, touchPoint.clientY - press.startY) >= TAP_THRESHOLD) {
          press.moved = true;
        }
      });

      // A finger that has not left its tap range has not started a drag: a wobble must not resize the selection
      // before the release is known to be a tap.
      if (![...this.#presses.values()].some(press => press.moved)) {
        event.preventDefault();

        return;
      }

      // Resolving a position walks the visible cells reading their geometry, and a phone can send
      // 120 touchmove/s. Skip that while the finger has barely moved - the cell cannot have changed.
      // The threshold lives here, NOT in `#extendSelection`: `#onAfterScroll` calls it with an
      // unchanged position on purpose, because there it is the viewport that moved.
      if (this.#lastTouchPosition !== null &&
          Math.abs(point.clientX - this.#lastTouchPosition.clientX) < TOUCH_MOVE_THRESHOLD &&
          Math.abs(point.clientY - this.#lastTouchPosition.clientY) < TOUCH_MOVE_THRESHOLD) {
        event.preventDefault();

        return;
      }

      this.#lastTouchPosition = point;

      this.#extendSelection(point.clientX, point.clientY);

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
   * Checks whether one specific finger is the one holding a handle. Reachable through `getPlugin`
   * because DragToScroll needs it - `isDragged()` alone would let it arm auto-scroll for any finger
   * landing anywhere while a drag happens to be running.
   *
   * @private
   * @param {number} identifier The finger's `Touch.identifier`.
   * @returns {boolean} Whether that finger grabbed a handle.
   */
  isDraggedBy(identifier: number): boolean {
    return this.#dragTouches.has(identifier);
  }

  /**
   * Forgets every finger and the range the gesture started from.
   */
  #resetDrag(): void {
    this.dragged.splice(0, this.dragged.length);
    this.#dragTouches.clear();
    this.#presses.clear();
    this.touchStartRange = undefined;
    this.#lastTouchPosition = null;
    this.#lastTargetCoords = null;
  }

  /**
   * Starts waiting for the tap that picks where the corner of the selection goes. The selection is the one the handle
   * was tapped on: a key that changes it first ends the pick's effect, because the handle is no longer on that corner.
   *
   * @param {string} handle Which handle was tapped.
   * @param {object} startRange The size and direction of the range when the handle was touched.
   * @param {number} startRange.width The width, in cells.
   * @param {number} startRange.height The height, in cells.
   * @param {string} startRange.direction The direction the range was selected in.
   */
  #startPick(handle: string, startRange: { width: number; height: number; direction: string }): void {
    const readCorners = () => {
      const range = this.hot.getSelectedRangeActive();

      if (!range) {
        return null;
      }

      const topStart = range.getTopStartCorner();
      const bottomEnd = range.getBottomEndCorner();

      return `${topStart.row},${topStart.col},${bottomEnd.row},${bottomEnd.col}`;
    };
    const armedCorners = readCorners();
    const root = this.hot.rootElement;

    // A second finger can tap while the first still holds the other handle, so a pick may already wait. Two picks
    // would leave the first one's listeners on the document for good.
    this.#pick?.cancel();

    if (armedCorners === null) {
      return;
    }

    this.#pickHandle = handle;
    addClass(root, `ht__picking-selection--${handle}`);
    this.#pick = armPick({
      doc: this.hot.rootDocument,
      root,
      // a tap on a handle is left to the handle: it ends the pick, and on the other handle it starts that one
      isAnchor: target => target instanceof Element && target.closest(HANDLE_HIT_AREA_SELECTOR) !== null,
      onPick: (event) => {
        if (readCorners() !== armedCorners) {
          return;
        }

        // The pick extends with its own handle and range. The shared drag state belongs to a finger that may still hold
        // the other handle, so it is neither read nor changed here. The de-duplication on the last target is reset
        // on both sides, because it follows that finger.
        this.#lastTargetCoords = null;
        this.#extendSelection(event.clientX, event.clientY, handle, startRange);
        this.#lastTargetCoords = null;
      },
      onEnd: (reason) => {
        this.#pick = null;
        this.#pickHandle = null;
        removeClass(root, `ht__picking-selection--${handle}`);

        if (reason === 'escape') {
          announce(String(this.hot.getTranslatedPhrase(C.ARMED_PICK_CANCELED) ?? ''), 'polite');
        }
      },
    });

    announce(String(this.hot.getTranslatedPhrase(C.ARMED_PICK_STARTED) ?? ''), 'polite');
  }

  /**
   * Reads where the finger driving the drag currently is.
   *
   * Follows the fingers that actually grabbed a handle, by identifier. Reading `touches[0]` instead
   * would follow whichever finger touched the screen first, so a thumb already resting on the grid
   * when the handle was grabbed would drive the selection.
   *
   * @param {Event} event The `touchmove` event.
   * @returns {object|null} The finger's position as `{clientX, clientY}`, or `null` when no
   * handle-holding finger appears in the event.
   */
  #getDragTouchPoint(event: Event): { clientX: number; clientY: number } | null {
    for (const identifier of this.#dragTouches.keys()) {
      const point = getTouchPointById(event, identifier);

      if (point !== null) {
        return point;
      }
    }

    return null;
  }

  /**
   * Ends a waiting pick when the selection changes (a key moved it, or the pick itself resized it): the handle it was
   * armed on no longer sits on the range, and the tap it waits for would be lost.
   */
  #onAfterSelection = (): void => {
    this.#pick?.cancel();
  };

  /**
   * Carries the drag on after DragToScroll moves the viewport.
   *
   * A finger held still past the grid edge produces no further `touchmove`, so without this the
   * selection would stop growing at the last cell that was on screen when the finger got there.
   *
   * `#extendSelection` can itself scroll its target into view, which fires `afterScroll` again. That
   * does not run away: the target is resolved against the CURRENT viewport and then de-duplicated on
   * coordinates, so it reaches a fixed point after one step. Measured with `dragToScroll: false`,
   * where nothing suppresses the scroll-into-view: it stops after one row and stays there.
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
   * @param {string} [handle] The handle that moves. The one a finger holds, unless a pick passes its own.
   * @param {object} [startRange] The range the gesture started from. The drag's, unless a pick passes its own.
   * @param {number} startRange.width The width, in cells.
   * @param {number} startRange.height The height, in cells.
   * @param {string} startRange.direction The direction the range was selected in.
   */
  #extendSelection(
    clientX: number,
    clientY: number,
    handle: string = this.dragged[0],
    startRange: { width: number; height: number; direction: string } | undefined = this.touchStartRange,
  ): void {
    const selectedRange = this.hot.getSelectedRangeActive();

    if (!selectedRange || startRange === undefined) {
      return;
    }

    const targetCoords = getCellCoordsFromMousePosition(this.hot, clientX, clientY);

    // `getCellCoordsFromMousePosition` clamps into the body, so a position over a header already
    // resolves to a real cell - there is no -1 to normalize. The floor only guards the helper's
    // empty-grid fallback, where `countCols() - 1` / `countRows() - 1` would be -1.
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
      startRange.direction,
      rangeDirection,
      handle
    );

    if (newRangeCoords.start !== null) {
      this.hot.selection.setRangeStart(newRangeCoords.start);
    }

    if (newRangeCoords.end !== null) {
      this.hot.selection.setRangeEnd(newRangeCoords.end);
    }
  }
}
