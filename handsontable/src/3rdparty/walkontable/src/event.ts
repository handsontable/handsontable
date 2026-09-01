import type CellCoords from './cell/coords';
import type CellRange from './cell/range';
import type { EngineContext } from './wire';
import {
  closestDown,
  eventTargetEl,
  getDeepActiveElement,
  hasClass,
  isChildOf,
  getParent,
} from '../../../helpers/dom/element';
import { partial } from '../../../helpers/function';
import { getCellCoordsFromMousePosition } from './utils/pointerToCoords';
import { isTouchSupported } from '../../../helpers/feature';
import { isMobileBrowser, isChromeWebKit, isFirefoxWebKit, isIOS } from '../../../helpers/browser';
import { isDefined } from '../../../helpers/mixed';
import { getMouseEventTouchOrigin, TOUCH_SYNTHESIZED_MOUSE_WINDOW } from '../../../helpers/dom/inputOrigin';

const LONG_PRESS_DELAY = 500;
const LONG_PRESS_MOVE_THRESHOLD = 10;

/**
 * How long (ms) after a mousedown the double-click detector keeps waiting for the matching
 * second click. Mirrors the OS double-click tolerance with margin.
 */
const DBLCLICK_MOUSEDOWN_TIMEOUT = 1000;

/**
 * How long (ms) after a mouseup the double-click detector keeps the first click "armed"
 * for a mouse-driven double-click.
 */
const DBLCLICK_MOUSEUP_TIMEOUT = 500;

/**
 * How long (ms) after a touch tap a second tap on the same cell counts as a double-tap. Touch
 * taps are paired by `#handleTouchTap()`, independently of the mouse double-click slots, so a
 * real mouse click after a tap never pairs with it. iOS drops taps under ~250 ms and humans
 * double-tap at 300–600 ms (DEV-2687).
 */
const TOUCH_DBLTAP_TIMEOUT = 1000;

/**
 * Assembles the Event module's dependencies from the engine composition context. The DOM roots,
 * settings, event manager, table, and selection manager fold into this one object; the parent Event
 * (for clones) stays a separate constructor argument because it is per-instance, not engine-wide.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The Event dependency set.
 */
export function createEventDeps(ctx: EngineContext) {
  return {
    facadeGetter: ctx.getFacade(),
    rootDocument: ctx.rootDocument,
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    wtSettings: ctx.wtSettings,
    eventManager: ctx.makeEventManager(),
    wtTable: ctx.getWtTable(),
    selectionManager: ctx.getSelectionManager(),
  };
}

/**
 * The Event module dependencies, inferred from `createEventDeps`.
 */
export type EventDeps = ReturnType<typeof createEventDeps>;

/**
 * The cell object `Event#parentCell()` returns: a TD/TH element and its coords, or both `null`
 * when the event target maps to neither a cell nor a border affordance.
 */
type ParentCell = ReturnType<Event['parentCell']>;

/**
 * @class Event
 */
class Event {
  /**
   * State object tracking momentum scrolling status and timeout.
   *
   * @type {{ ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> }}
   */
  declare momentumScrolling: { ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> };
  /**
   * Flag indicating whether a touch event is currently being processed.
   *
   * @type {boolean}
   */
  declare touchApplied: boolean;
  /**
   * Reference to the last element the mouse was over, or null if none.
   *
   * @type {HTMLElement | null}
   */
  declare lastMouseOver: HTMLElement | null;

  /**
   * The Event module dependencies (same `#deps` pattern as the other Walkontable modules).
   *
   * @type {EventDeps}
   */
  #deps: EventDeps;
  /**
   * Parent Event instance, or null for the root instance.
   *
   * @type {Event | null}
   */
  #parent;
  /**
   * @type {boolean}
   */
  #selectedCellBeforeTouchEnd: CellRange | null = null;
  /**
   * @type {number[]}
   */
  #dblClickTimeout: (ReturnType<typeof setTimeout> | null)[] = [null, null];
  /**
   * @type {number[]}
   */
  #dblClickOrigin: (HTMLElement | null)[] = [null, null];
  /**
   * Coordinates of the most recent touch tap, kept for double-tap detection. Coordinates, not the
   * resolved TD: Walkontable recycles TD elements across scrolls and re-renders, so element
   * identity can pair two taps that landed on different cells (DEV-2687 review). Touch taps never
   * arm the mouse double-click slots, so a mouse click after a tap cannot pair with a tap.
   *
   * @type {CellCoords|null}
   */
  #lastTapCoords: CellCoords | null = null;
  /**
   * Timestamp (ms) of the most recent touch tap.
   *
   * @type {number}
   */
  #lastTapAt: number = 0;
  /**
   * Timer ID for the long-press gesture detection.
   *
   * @type {number|null}
   */
  #longPressTimeout: ReturnType<typeof setTimeout> | null = null;
  /**
   * Marks that the long-press contextmenu gesture has been triggered for the current touch.
   *
   * @type {boolean}
   */
  #longPressFired: boolean = false;
  /**
   * Starting coordinates of a touch gesture (used to detect movement that cancels long-press
   * and to distinguish a tap from a scroll).
   *
   * @type {{ x: number, y: number }|null}
   */
  #touchStartCoords: { x: number; y: number } | null = null;
  /**
   * Marks that the current touch gesture has moved beyond the threshold and should be treated
   * as a scroll rather than a tap.
   *
   * @type {boolean}
   */
  #touchWasMoved: boolean = false;
  /**
   * The original `touchstart` event captured so the synthesized mousedown can be deferred to
   * `touchend` and only fired when the gesture is a tap (not a scroll).
   *
   * @type {TouchEvent|null}
   */
  #deferredTouchStartEvent: TouchEvent | null = null;
  /**
   * Timestamp (ms) of the most recent `onMouseUp` call that originated from a touch gesture.
   * On devices that register both touch and mouse listeners (iPad with a desktop UA, Windows
   * touchscreens) the browser synthesizes a `mousedown`/`mouseup`/`click` sequence after
   * `touchend`. The whole sequence must be ignored – dropping only one half fires
   * `onCellMouseDown` a second time per tap, and the leaked pair would act as a phantom mouse
   * click (DEV-2687).
   * Used as the fallback for engines that do not expose `sourceCapabilities`
   * (see `#isTouchSynthesizedMouseEvent`).
   *
   * @type {number}
   */
  #lastTouchMouseUpAt: number = 0;
  /**
   * `true` between a touch-driven `onMouseUp` and the browser-synthesized `mouseup` that follows it.
   * Only that first pair is dropped; once it is consumed, real mouse events pass even inside the
   * `TOUCH_SYNTHESIZED_MOUSE_WINDOW` ceiling, so a fill-handle drag or a drag-selection started with
   * a mouse right after a tap works on engines that do not report the input origin (DEV-2687). The
   * flag is re-armed by every touch-driven `onMouseUp` and cleared when a scroll-classified gesture
   * ends, so a tap that synthesized nothing cannot swallow that gesture's own compatibility pair.
   *
   * @type {boolean}
   */
  #synthesizedPairPending: boolean = false;
  /**
   * @type {boolean}
   */
  #mouseDown: boolean = false;
  /**
   * The last renderable coords seen in `onMouseMove` while the mouse was outside the viewport.
   * Used to skip the `onCellMouseOverOutside` listener call (and therefore `setRangeEnd`) when
   * repeated mousemove events land on the same edge cell.
   *
   * @type {{ row: number, col: number } | null}
   */
  #mouseOverOutsideLastCoords: { row: number; col: number } | null = null;

  /**
   * @param {EventDeps} deps The Event module dependencies.
   * @param {Event} [parent=null] The main Event instance.
   */
  constructor(deps: EventDeps, parent: Event | null = null) {
    this.#deps = deps;
    this.#parent = parent;

    this.registerEvents();
  }

  /**
   * Adds listeners for mouse and touch events.
   *
   * @private
   */
  registerEvents() {
    this.#deps.eventManager.addEventListener(this.#deps.wtTable.holder, 'contextmenu',
      (event: MouseEvent) => this.onContextMenu(event));
    this.#deps.eventManager.addEventListener(this.#deps.wtTable.TABLE, 'mouseover',
      (event: MouseEvent) => this.onMouseOver(event));
    this.#deps.eventManager.addEventListener(this.#deps.wtTable.TABLE, 'mouseout',
      (event: MouseEvent) => this.onMouseOut(event));

    if (this.#deps.wtTable.isMaster) {
      this.#deps.eventManager.addEventListener(
        this.#deps.rootDocument,
        'mousemove',
        (event: MouseEvent) => this.onMouseMove(event)
      );
      this.#deps.eventManager.addEventListener(
        this.#deps.rootDocument,
        'mouseup',
        () => {
          this.#mouseDown = false;
          this.#mouseOverOutsideLastCoords = null;
        }
      );
    }

    const initTouchEvents = () => {
      this.#deps.eventManager.addEventListener(this.#deps.wtTable.holder, 'touchstart',
        (event: TouchEvent) => this.onTouchStart(event));
      this.#deps.eventManager.addEventListener(this.#deps.wtTable.holder, 'touchend',
        (event: TouchEvent) => this.onTouchEnd(event));
      this.#deps.eventManager.addEventListener(this.#deps.wtTable.holder, 'touchmove',
        (event: TouchEvent) => this.onTouchMove(event));
      this.#deps.eventManager.addEventListener(this.#deps.wtTable.holder, 'touchcancel',
        () => this.onTouchCancel());
      this.#deps.eventManager.addEventListener(this.#deps.wtTable.holder, 'scroll', () => this.onHolderScroll());
    };

    const initMouseEvents = () => {
      // On devices that register both touch and mouse listeners (e.g. iPad Safari with a
      // desktop UA), `touchend` already drove `onMouseDown`/`onMouseUp`. The browser then
      // synthesizes a `mousedown`/`mouseup` pair ~0-50 ms later; drop BOTH halves when the
      // touch path handled the tap, so `onCellMouseDown` fires once per tap (DEV-2687) and
      // context-menu commands do not execute twice (#12803).
      this.#deps.eventManager.addEventListener(this.#deps.wtTable.holder, 'mouseup',
        (event: MouseEvent) => {
          if (this.#isTouchSynthesizedMouseEvent(event)) {
            return;
          }
          this.onMouseUp(event);
        });
      this.#deps.eventManager.addEventListener(this.#deps.wtTable.holder, 'mousedown',
        (event: MouseEvent) => {
          if (this.#isTouchSynthesizedMouseEvent(event)) {
            return;
          }
          this.onMouseDown(event);
        });
    };

    if (isMobileBrowser()) {
      initTouchEvents();
    } else {
      // PC like devices which support both methods (touchscreen and ability to plug-in mouse).
      if (isTouchSupported()) {
        initTouchEvents();
      }

      initMouseEvents();
    }
  }

  /**
   * Checks if an element is already selected.
   *
   * @private
   * @param {Element} touchTarget An element to check.
   * @returns {boolean}
   */
  selectedCellWasTouched(touchTarget: Element | null) {
    const cellUnderFinger = this.parentCell(touchTarget);
    const coordsOfCellUnderFinger = cellUnderFinger.coords;

    if (this.#selectedCellBeforeTouchEnd && coordsOfCellUnderFinger) {
      const [rowTouched, rowSelected] = [coordsOfCellUnderFinger.row, this.#selectedCellBeforeTouchEnd.from.row];
      const [colTouched, colSelected] = [coordsOfCellUnderFinger.col, this.#selectedCellBeforeTouchEnd.from.col];

      return rowTouched === rowSelected && colTouched === colSelected;
    }

    return false;
  }

  /**
   * Gets closest TD or TH element.
   *
   * @private
   * @param {Element} elem An element from the traversing starts.
   * @returns {object} Contains coordinates and reference to TD or TH if it exists. Otherwise it's empty object.
   */
  parentCell(elem: Element | null) {
    const cell: { coords: CellCoords | null; TD: HTMLTableCellElement | null } = { coords: null, TD: null };
    const TABLE = this.#deps.wtTable.TABLE;
    const TD = closestDown(elem, ['TD', 'TH'], TABLE);

    const elemEl = elem as HTMLElement;

    if (TD) {
      cell.coords = this.#deps.wtTable.getCoords(TD);
      cell.TD = TD as HTMLTableCellElement;

    } else if (hasClass(elemEl, 'wtBorder') && hasClass(elemEl, 'current')) {
      const focusCellRange = this.#deps.selectionManager.getFocusSelection()?.cellRange;

      if (focusCellRange) {
        cell.coords = focusCellRange.highlight;
        cell.TD = this.#deps.wtTable.getCell(cell.coords) as HTMLTableCellElement;
      }

    } else if (hasClass(elemEl, 'wtBorder') && hasClass(elemEl, 'area')) {
      const areaCellRange = this.#deps.selectionManager.getAreaSelection()?.cellRange;

      if (areaCellRange) {
        cell.coords = areaCellRange.to;
        cell.TD = this.#deps.wtTable.getCell(cell.coords) as HTMLTableCellElement;
      }
    }

    return cell;
  }

  /**
   * Decides whether a mouse event caught by the mouse listeners is one half of the browser-synthesized
   * `mousedown`/`mouseup` pair that follows a touch tap, and must therefore be dropped. Order of the
   * checks: an engine that reports the input origin and says "not touch" wins (Blink, a real mouse or
   * pen is never dropped); otherwise the event is synthesized only if a touch-driven `onMouseUp` just
   * armed the pair (`#synthesizedPairPending`) and the ceiling has not passed. The `mouseup` half
   * consumes the pair, so any later mouse event inside the ceiling is treated as real. Dropping both
   * halves keeps `onCellMouseDown` at one call per tap and context-menu commands at one execution
   * (#12803); a tap that left no stamp (a gesture treated as a scroll) has its pair processed.
   *
   * @param {MouseEvent} event The mouse event object.
   * @returns {boolean}
   */
  #isTouchSynthesizedMouseEvent(event: MouseEvent): boolean {
    if (getMouseEventTouchOrigin(event) === false) {
      return false;
    }

    const withinCeiling = Date.now() - this.#lastTouchMouseUpAt < TOUCH_SYNTHESIZED_MOUSE_WINDOW;

    if (!this.#synthesizedPairPending || !withinCeiling) {
      this.#synthesizedPairPending = false;

      return false;
    }

    if (event.type === 'mouseup') {
      this.#synthesizedPairPending = false;
    }

    return true;
  }

  /**
   * OnMouseDown callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseDown(event: MouseEvent | TouchEvent) {
    const activeElement = getDeepActiveElement(this.#deps.rootDocument);
    const targetEl = eventTargetEl(event)!;
    const getParentNode = (level: number) => getParent(targetEl, level);
    const realTarget = eventTargetEl(event);

    // ignore non-TD focusable elements from mouse down processing
    // (https://github.com/handsontable/handsontable/issues/3555)
    if (activeElement && !['TD', 'TH'].includes(activeElement.nodeName) &&
      (
        realTarget === activeElement ||
        getParentNode(0) === activeElement ||
        getParentNode(1) === activeElement
      )
    ) {
      return;
    }

    const cell = this.parentCell(realTarget);

    if (hasClass(realTarget!, 'corner')) {
      this.#deps.wtSettings.getSetting('onCellCornerMouseDown', event, realTarget);

    } else if (cell.TD) {
      this.#mouseDown = true;
      this.#mouseOverOutsideLastCoords = null;

      if (this.#deps.wtSettings.has('onCellMouseDown')) {
        this.callListener('onCellMouseDown', event, cell.coords!, cell.TD);
      }
    }

    // The mouse double-click slots are armed by mouse clicks only; touch taps are paired by
    // #handleTouchTap() in onMouseUp (DEV-2687).
    if (!this.touchApplied && (event as MouseEvent).button === 0 && cell.TD) {
      this.#dblClickOrigin[0] = cell.TD;

      if (this.#dblClickTimeout[0] !== null) {
        clearTimeout(this.#dblClickTimeout[0]);
      }

      this.#dblClickTimeout[0] = setTimeout(() => {
        this.#dblClickOrigin[0] = null;
      }, DBLCLICK_MOUSEDOWN_TIMEOUT);
    }
  }

  /**
   * OnContextMenu callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onContextMenu(event: MouseEvent) {
    this.#cancelLongPressTimer();

    if (this.#deps.wtSettings.has('onCellContextMenu')) {
      const cell = this.parentCell(eventTargetEl(event));

      if (cell.TD) {
        this.callListener('onCellContextMenu', event, cell.coords!, cell.TD);
      }
    }
  }

  /**
   * OnMouseOver callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseOver(event: MouseEvent) {
    if (!this.#deps.wtSettings.has('onCellMouseOver')) {
      return;
    }

    const table = this.#deps.wtTable.TABLE;
    const td = closestDown(eventTargetEl(event)!, ['TD', 'TH'], table);
    const parent = this.#parent || this;

    if (td && td !== parent.lastMouseOver && isChildOf(td, table)) {
      parent.lastMouseOver = td;

      const tdCoords = this.#deps.wtTable.getCoords(td);

      if (tdCoords) {
        this.callListener('onCellMouseOver', event, tdCoords, td);
      }
    }
  }

  /**
   * OnMouseMove callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseMove(event: MouseEvent) {
    if (!this.#mouseDown) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { coords, isOutside } = this.#getCellCoordsFromMousePosition(event.clientX, event.clientY);

    if (isOutside) {
      const lastCoords = this.#mouseOverOutsideLastCoords;

      if (!lastCoords || lastCoords.row !== coords.row || lastCoords.col !== coords.col) {
        const TD = this.#deps.wtTable.getCell(coords);

        if (TD instanceof HTMLElement) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          this.#mouseOverOutsideLastCoords = { row: coords.row, col: coords.col };
          this.callListener('onCellMouseOverOutside', event, coords, TD);
        }
      }
    } else {
      this.#mouseOverOutsideLastCoords = null;
    }
  }

  /**
   * Returns the cell coordinates for the given mouse position and whether the mouse is
   * outside the visible viewport. When the mouse is outside, the nearest edge cell is returned.
   *
   * @private
   * @param {number} mouseX Client X coordinate of the mouse.
   * @param {number} mouseY Client Y coordinate of the mouse.
   * @returns {{ coords: CellCoords, isOutside: boolean }}
   */
  #getCellCoordsFromMousePosition(mouseX: number, mouseY: number) {
    return getCellCoordsFromMousePosition(this.#deps, mouseX, mouseY);
  }

  /**
   * OnMouseOut callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseOut(event: MouseEvent) {
    if (!this.#deps.wtSettings.has('onCellMouseOut')) {
      return;
    }

    const table = this.#deps.wtTable.TABLE;
    const lastTD = closestDown(eventTargetEl(event)!, ['TD', 'TH'], table);
    const nextTD = closestDown(event.relatedTarget as HTMLElement | null, ['TD', 'TH'], table);
    const parent = this.#parent || this;

    if (lastTD && lastTD !== nextTD && isChildOf(lastTD, table)) {
      const lastTDCoords = this.#deps.wtTable.getCoords(lastTD);

      if (lastTDCoords) {
        this.callListener('onCellMouseOut', event, lastTDCoords, lastTD);
      }

      if (nextTD === null) {
        parent.lastMouseOver = null;
      }
    }
  }

  /**
   * OnMouseUp callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseUp(event: MouseEvent | TouchEvent) {
    this.#mouseDown = false;
    this.#mouseOverOutsideLastCoords = null;

    const cell = this.parentCell(eventTargetEl(event));

    if (cell.TD && this.#deps.wtSettings.has('onCellMouseUp')) {
      this.callListener('onCellMouseUp', event, cell.coords!, cell.TD);
    }

    if (this.touchApplied) {
      this.#handleTouchTap(event, cell);

      return;
    }

    // ignore non-left mouse buttons
    if ((event as MouseEvent).button !== 0) {
      return;
    }

    if (cell.TD && cell.TD === this.#dblClickOrigin[0] && cell.TD === this.#dblClickOrigin[1]) {
      this.#fireDblClick(event, cell);

      this.#dblClickOrigin[0] = null;
      this.#dblClickOrigin[1] = null;

    } else if (cell.TD && cell.TD === this.#dblClickOrigin[0]) {
      this.#dblClickOrigin[1] = cell.TD;

      if (this.#dblClickTimeout[1] !== null) {
        clearTimeout(this.#dblClickTimeout[1]);
      }

      this.#dblClickTimeout[1] = setTimeout(() => {
        this.#dblClickOrigin[1] = null;
      }, DBLCLICK_MOUSEUP_TIMEOUT);
    }
  }

  /**
   * Pairs touch taps into double-taps. Called from `onMouseUp` while `touchApplied` is `true`,
   * i.e. for the `onMouseUp` that `onTouchEnd` drives. Two taps on the same coordinates within
   * `TOUCH_DBLTAP_TIMEOUT` fire the double-click callbacks; a long-press, a tap outside the cells,
   * or a tap on different coordinates resets the detector.
   *
   * @param {MouseEvent|TouchEvent} event The event that ended the tap.
   * @param {ParentCell} cell The tapped cell, as returned by `parentCell()`.
   */
  #handleTouchTap(event: MouseEvent | TouchEvent, cell: ParentCell): void {
    if (this.#longPressFired || !cell.TD || !cell.coords) {
      this.#lastTapCoords = null;

      return;
    }

    const now = Date.now();
    const isSameCell = this.#lastTapCoords !== null &&
      this.#lastTapCoords.row === cell.coords.row && this.#lastTapCoords.col === cell.coords.col;

    if (isSameCell && now - this.#lastTapAt < TOUCH_DBLTAP_TIMEOUT) {
      this.#fireDblClick(event, cell);
      this.#lastTapCoords = null;

      return;
    }

    // Clone: parentCell()'s border branches return references into the live selection CellRange,
    // which normalize() mutates in place — a stored alias could silently shift within the
    // double-tap window.
    this.#lastTapCoords = cell.coords.clone();
    this.#lastTapAt = now;
  }

  /**
   * Fires the corner or the cell double-click callback for the given cell.
   *
   * @param {MouseEvent|TouchEvent} event The event that completed the double-click.
   * @param {ParentCell} cell The double-clicked cell.
   */
  #fireDblClick(event: MouseEvent | TouchEvent, cell: ParentCell): void {
    if (hasClass(eventTargetEl(event)!, 'corner')) {
      this.callListener('onCellCornerDblClick', event, cell.coords!, cell.TD!);
    } else {
      this.callListener('onCellDblClick', event, cell.coords!, cell.TD!);
    }
  }

  /**
   * OnTouchStart callback. Captures the gesture start so the synthesized mousedown can be
   * deferred to `touchend`; this lets a touch-drag gesture scroll the grid without
   * re-triggering the cell selection (see issue #11659).
   *
   * @private
   * @param {TouchEvent} event The touch event object.
   */
  onTouchStart(event: TouchEvent) {
    this.#selectedCellBeforeTouchEnd = this.#deps.selectionManager.getFocusSelection()?.cellRange ?? null;
    this.touchApplied = true;
    this.#touchWasMoved = false;
    this.#longPressFired = false;
    this.#deferredTouchStartEvent = event;

    this.#startLongPressTimer(event);
  }

  /**
   * OnTouchEnd callback. Fires the deferred mousedown only when the gesture is a tap
   * (no movement past the threshold and no long-press); for a scroll gesture the
   * selection stays untouched (see issue #11659).
   *
   * @private
   * @param {TouchEvent} event The touch event object.
   */
  onTouchEnd(event: TouchEvent) {
    const wasScrolled = this.#touchWasMoved;
    const isTap = !wasScrolled && !this.#longPressFired && this.#deferredTouchStartEvent !== null;
    const deferredTouchStartEvent = this.#deferredTouchStartEvent;

    this.#cancelLongPressTimer();
    this.#deferredTouchStartEvent = null;

    if (isTap && deferredTouchStartEvent !== null) {
      this.onMouseDown(deferredTouchStartEvent);
    }

    const target = eventTargetEl(event);
    const parentCellCoords = this.parentCell(target)?.coords;
    const isCellsRange = parentCellCoords !== null && parentCellCoords !== undefined &&
      ((parentCellCoords.row ?? -1) >= 0 && (parentCellCoords.col ?? -1) >= 0);
    const isEventCancelable = event.cancelable && isCellsRange &&
      this.#deps.wtSettings.getSetting('isDataViewInstance');

    // To prevent accidental redirects or other actions that the interactive elements (e.q "A" link) do
    // while the cell is highlighted, all touch events that are triggered on different cells are
    // "preventDefault"'ed. The user can interact with the element (e.q. click on the link that opens
    // a new page) only when the same cell was previously selected (see related PR #7980).
    if (isEventCancelable) {
      const interactiveElements = ['A', 'BUTTON', 'INPUT'];

      // For browsers that use the WebKit as an engine (excluding Safari), there is a bug. The prevent
      // default has to be called all the time. Otherwise, the second tap won't be triggered (probably
      // caused by the native ~300ms delay - https://webkit.org/blog/5610/more-responsive-tapping-on-ios/).
      // To make the interactive elements work, the event target element has to be check. If the element
      // matches the allow-list, the event is not prevented.
      if (isIOS() &&
          (isChromeWebKit() || isFirefoxWebKit()) &&
          this.selectedCellWasTouched(target) &&
          !interactiveElements.includes(target!.tagName)) {
        event.preventDefault();

      } else if (!this.selectedCellWasTouched(target) &&
                 !(target!.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox')) {
        // For other browsers, prevent default is fired only for the first tap and only when the previous
        // highlighted cell was different. Checkbox inputs are excluded so that checkboxes with
        // disableVisualSelection can still be toggled via touch (the focus cellRange is never populated
        // when visual selection is disabled, so selectedCellWasTouched always returns false for them).
        event.preventDefault();
      }
    }

    // Fire mouseUp whenever the gesture also produced a mouseDown - either a tap
    // (deferred mousedown above) or a long-press (mousedown fired from the timer
    // callback). Skipping it for a long-press that ended in a scroll would leave
    // an unpaired mousedown and break plugins listening to onCellMouseUp /
    // before/after hooks (e.g. nestedHeaders, ContextMenu close logic).
    // Suppress only for pure scroll gestures, where onMouseDown was never fired.
    if (!wasScrolled || this.#longPressFired) {
      // The stamp is taken AFTER the tap is handled, so the selection/render work onMouseUp does
      // is not charged against the TOUCH_SYNTHESIZED_MOUSE_WINDOW ceiling. Everything onMouseUp
      // triggers is synchronous; the browser only dispatches the synthesized mousedown/mouseup
      // sequence after this touchend handler returns.
      this.onMouseUp(event);
      this.#lastTouchMouseUpAt = Date.now();
      this.#synthesizedPairPending = true;
    } else {
      // A pure scroll gesture calls neither onMouseDown nor onMouseUp, so #handleTouchTap never
      // runs to reset the tap detector. Reset it here so a scroll between two taps can't pair them.
      this.#lastTapCoords = null;
      // This gesture armed nothing, so a still-pending flag belongs to an earlier gesture whose
      // pair never came; clear it so THIS gesture's compatibility pair is processed.
      this.#synthesizedPairPending = false;
    }

    this.touchApplied = false;
    this.#touchWasMoved = false;
    this.#longPressFired = false;
  }

  /**
   * OnTouchCancel callback. Browsers cancel a gesture instead of ending it whenever the system
   * claims the touch (an edge-swipe, a dialog, a context callout) — `touchend` then never fires.
   * Without this reset `touchApplied` stays `true` and every REAL mouse `mouseup` is routed into
   * the touch tap detector, which has no button filter, so two right-clicks or two drag-selections
   * ending on the same cell within the double-tap window would fire a phantom double-click.
   * It also releases the mouse-down flag: a long-press fires `onMouseDown` from its timer, and
   * after a cancel no `mouseup` ever follows, which would leave mouse-move selection dragging
   * armed until the next click. The pending synthesized-pair flag is cleared for the same reason
   * the scroll branch of `onTouchEnd` clears it: a cancelled gesture armed nothing, so a
   * still-pending flag belongs to an earlier gesture whose pair never came, and left in place it
   * would drop the next real mouse pair inside the ceiling on engines that do not report the
   * input origin.
   *
   * @private
   */
  onTouchCancel() {
    this.#cancelLongPressTimer();

    this.touchApplied = false;
    this.#mouseDown = false;
    this.#touchWasMoved = false;
    this.#longPressFired = false;
    this.#deferredTouchStartEvent = null;
    this.#lastTapCoords = null;
    this.#synthesizedPairPending = false;
  }

  /**
   * Starts the long-press timer. When the timer fires, a synthetic `contextmenu` event is
   * dispatched on the original touch target so that the existing contextmenu hook chain
   * (and ContextMenu plugin) work without changes.
   *
   * @private
   * @param {TouchEvent} event The original `touchstart` event.
   */
  #startLongPressTimer(event: TouchEvent) {
    this.#cancelLongPressTimer();

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    this.#touchStartCoords = { x: touch.clientX, y: touch.clientY };

    this.#longPressTimeout = setTimeout(() => {
      this.#longPressTimeout = null;
      this.#longPressFired = true;
      this.#touchStartCoords = null;

      // Select the long-pressed cell so context-menu commands (e.g. "Insert row above")
      // operate on it. With the deferred-mousedown flow, touchend skips onMouseDown
      // when #longPressFired is true, so we fire it here before opening the menu.
      this.onMouseDown(event);

      this.#dblClickOrigin[0] = null;
      this.#dblClickOrigin[1] = null;
      this.#lastTapCoords = null;

      if (this.#dblClickTimeout[0] !== null) {
        clearTimeout(this.#dblClickTimeout[0]);
      }
      if (this.#dblClickTimeout[1] !== null) {
        clearTimeout(this.#dblClickTimeout[1]);
      }

      const target = event.target;

      if (!target) {
        return;
      }

      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
      });

      target.dispatchEvent(contextMenuEvent);
    }, LONG_PRESS_DELAY);
  }

  /**
   * Holder `scroll` callback. Cancels the long-press timer and runs the momentum-scroll
   * bookkeeping. When called during an active touch sequence it also marks the gesture
   * as a scroll so the deferred mousedown is not fired on `touchend` - native scrolling
   * can start at ~8px, before the 10px LONG_PRESS_MOVE_THRESHOLD that `onTouchMove`
   * watches (issue #11659).
   *
   * @private
   */
  onHolderScroll() {
    if (!this.momentumScrolling) {
      this.momentumScrolling = {};
    }
    if (this.touchApplied) {
      this.#touchWasMoved = true;
    }
    this.#cancelLongPressTimer();
    clearTimeout(this.momentumScrolling._timeout);

    if (!this.momentumScrolling.ongoing) {
      this.#deps.wtSettings.getSetting('onBeforeTouchScroll');
    }
    this.momentumScrolling.ongoing = true;

    this.momentumScrolling._timeout = setTimeout(() => {
      if (!this.touchApplied) {
        this.momentumScrolling.ongoing = false;

        this.#deps.wtSettings.getSetting('onAfterMomentumScroll');
      }
    }, 200);
  }

  /**
   * Cancels the pending long-press timer.
   *
   * @private
   */
  #cancelLongPressTimer() {
    if (this.#longPressTimeout !== null) {
      clearTimeout(this.#longPressTimeout);
      this.#longPressTimeout = null;
    }
    this.#touchStartCoords = null;
  }

  /**
   * OnTouchMove callback. Once the finger moves beyond the threshold, marks the gesture as a
   * scroll so `touchend` skips firing the deferred mousedown, and cancels the long-press timer.
   *
   * @private
   * @param {TouchEvent} event The touch event object.
   */
  onTouchMove(event: TouchEvent) {
    if (this.#touchStartCoords === null) {
      return;
    }

    const touch = event.touches[0];

    if (!touch) {
      this.#touchWasMoved = true;
      this.#cancelLongPressTimer();

      return;
    }

    const dx = Math.abs(touch.clientX - this.#touchStartCoords.x);
    const dy = Math.abs(touch.clientY - this.#touchStartCoords.y);

    if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
      this.#touchWasMoved = true;
      this.#cancelLongPressTimer();
    }
  }

  /**
   * Call listener with backward compatibility.
   *
   * @private
   * @param {string} name Name of listener.
   * @param {MouseEvent} event The event object.
   * @param {CellCoords} coords Coordinates.
   * @param {HTMLElement} target Event target.
   */
  callListener(name: string, event: Event | MouseEvent | TouchEvent, coords: CellCoords, target: HTMLElement) {
    type ListenerFn = (
      event: Event | MouseEvent | TouchEvent, coords: CellCoords, target: HTMLElement, facade: unknown) => void;
    const listener = this.#deps.wtSettings.getSettingPure(name) as ListenerFn | undefined;

    if (listener) {
      listener(event, coords, target, this.#deps.facadeGetter());
    }
  }

  /**
   * Clears double-click timeouts and destroys the internal eventManager instance.
   */
  destroy() {
    if (this.#dblClickTimeout[0] !== null) {
      clearTimeout(this.#dblClickTimeout[0]);
    }
    if (this.#dblClickTimeout[1] !== null) {
      clearTimeout(this.#dblClickTimeout[1]);
    }
    this.#cancelLongPressTimer();

    if (this.momentumScrolling) {
      clearTimeout(this.momentumScrolling._timeout);
    }

    this.#deps.eventManager.destroy();
  }
}

export default Event;
