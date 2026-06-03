import type CellCoords from './cell/coords';
import type CellRange from './cell/range';
import type from './types';
import type Settings from './settings';
import type Table from './table';
import type from './selection/manager';
import type EventManager from '../../../eventManager';
import {
  closestDown,
  eventTargetEl,
  hasClass,
  isChildOf,
  getParent,
} from '../../../helpers/dom/element';
import from '../../../helpers/function';
import from '../../../helpers/number';
import from './utils/cellCoords';
import from '../../../helpers/feature';
import from '../../../helpers/browser';
import from '../../../helpers/mixed';

const LONG_PRESS_DELAY = 500;
const LONG_PRESS_MOVE_THRESHOLD = 10;

/**
 * @class Event
 */
class Event {
  /**
   * Tracks momentum (inertial) scroll state and the timer used to detect when it ends.
   */
  declare momentumScrolling: { ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> };
  /**
   * Indicates that the current interaction originated from a touch event rather than a mouse event.
   */
  declare touchApplied: boolean;
  /**
   * The last TD or TH element that received a `mouseover` event in this table.
   */
  declare lastMouseOver: HTMLElement | null;

  /**
   * Walkontable settings instance used to read configuration values and trigger setting callbacks.
   */
  #wtSettings;
  /**
   * Bindings to the root document and window used for attaching global event listeners.
   */
  #domBindings;
  /**
   * The Table instance this event handler is attached to.
   */
  #wtTable;
  /**
   * Manages the active cell selections and provides access to focus and area selection ranges.
   */
  #selectionManager: SelectionManager;
  /**
   * Reference to the parent Event instance for overlay tables; null for the master table.
   */
  #parent;
  /**
   * Instance of {@link EventManager}.
   *
   */
  #eventManager;
  /**
   * Should be use only for passing face called external origin methods, like registered event listeners.
   * It provides backward compatibility by getting instance facade.
   *
   * @todo Consider about removing this from Event class, because it make relationship into facade (implicit circular
   *   dependency).
   * @todo Con. Maybe passing listener caller as an ioc from faced resolves this issue. To rethink later.
   *
   */
  #facadeGetter;
  /**
   */
  #selectedCellBeforeTouchEnd: CellRange | null = null;
  /**
   */
  #dblClickTimeout: (ReturnType<typeof setTimeout> | null)[] = [null, null];
  /**
   */
  #dblClickOrigin: (HTMLElement | null)[] = [null, null];
  /**
   * Timer ID for the long-press gesture detection.
   *
   */
  #longPressTimeout: ReturnType<typeof setTimeout> | null = null;
  /**
   * Marks that the long-press contextmenu gesture has been triggered for the current touch.
   *
   */
  #longPressFired: boolean = false;
  /**
   * Starting coordinates of a touch gesture (used to detect movement that cancels long-press
   * and to distinguish a tap from a scroll).
   *
   */
  #touchStartCoords: | null = null;
  /**
   * Marks that the current touch gesture has moved beyond the threshold and should be treated
   * as a scroll rather than a tap.
   *
   */
  #touchWasMoved: boolean = false;
  /**
   * The original `touchstart` event captured so the synthesized mousedown can be deferred to
   * `touchend` and only fired when the gesture is a tap (not a scroll).
   *
   */
  #deferredTouchStartEvent: TouchEvent | null = null;
  /**
   */
  #mouseDown: boolean = false;
  /**
   * The last renderable coords seen in `onMouseMove` while the mouse was outside the viewport.
   * Used to skip the `onCellMouseOverOutside` listener call (and therefore `setRangeEnd`) when
   * repeated mousemove events land on the same edge cell.
   *
   * @type | null}
   */
  #mouseOverOutsideLastCoords: | null = null;

  /**
   * @param facadeGetter Gets an instance facade.
   * @param domBindings Bindings into dom.
   * @param wtSettings The walkontable settings.
   * @param eventManager The walkontable event manager.
   * @param wtTable The table.
   * @param selectionManager Selections.
   * @param [parent=null] The main Event instance.
   */
  constructor(
    facadeGetter: Function, domBindings: DomBindings, wtSettings: Settings,
    eventManager: EventManager, wtTable: Table, selectionManager: SelectionManager,
    parent: Event | null = null) {
    this.#wtSettings = wtSettings;
    this.#domBindings = domBindings;
    this.#wtTable = wtTable;
    this.#selectionManager = selectionManager;
    this.#parent = parent;
    this.#eventManager = eventManager;
    this.#facadeGetter = facadeGetter;

    this.registerEvents();
  }

  /**
   * Adds listeners for mouse and touch events.
   *
   * @private
   */
  registerEvents() {
    this.#eventManager.addEventListener(this.#wtTable.holder, 'contextmenu',
      (event: MouseEvent) => this.onContextMenu(event));
    this.#eventManager.addEventListener(this.#wtTable.TABLE, 'mouseover',
      (event: MouseEvent) => this.onMouseOver(event));
    this.#eventManager.addEventListener(this.#wtTable.TABLE, 'mouseout',
      (event: MouseEvent) => this.onMouseOut(event));

    if (this.#wtTable.isMaster) {
      this.#eventManager.addEventListener(
        this.#domBindings.rootDocument,
        'mousemove',
        (event: MouseEvent) => this.onMouseMove(event)
      );
      this.#eventManager.addEventListener(
        this.#domBindings.rootDocument,
        'mouseup',
        () => {
          this.#mouseDown = false;
          this.#mouseOverOutsideLastCoords = null;
        }
      );
    }

    const initTouchEvents = () => {
      this.#eventManager.addEventListener(this.#wtTable.holder, 'touchstart',
        (event: TouchEvent) => this.onTouchStart(event));
      this.#eventManager.addEventListener(this.#wtTable.holder, 'touchend',
        (event: TouchEvent) => this.onTouchEnd(event));
      this.#eventManager.addEventListener(this.#wtTable.holder, 'touchmove',
        (event: TouchEvent) => this.onTouchMove(event));
      this.#eventManager.addEventListener(this.#wtTable.holder, 'scroll', () => this.onHolderScroll());
    };

    const initMouseEvents = () => {
      this.#eventManager.addEventListener(this.#wtTable.holder, 'mouseup',
        (event: MouseEvent) => this.onMouseUp(event));
      this.#eventManager.addEventListener(this.#wtTable.holder, 'mousedown',
        (event: MouseEvent) => this.onMouseDown(event));
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
   * @param touchTarget An element to check.
   * @returns 
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
   * @param elem An element from the traversing starts.
   * @returns Contains coordinates and reference to TD or TH if it exists. Otherwise it's empty object.
   */
  parentCell(elem: Element | null) {
    const cell: = { coords: null, TD: null };
    const TABLE = this.#wtTable.TABLE;
    const TD = closestDown(elem, ['TD', 'TH'], TABLE);

    const elemEl = elem as HTMLElement;

    if (TD) {
      cell.coords = this.#wtTable.getCoords(TD);
      cell.TD = TD as HTMLTableCellElement;

    } else if (hasClass(elemEl, 'wtBorder') && hasClass(elemEl, 'current')) {
      const focusCellRange = this.#selectionManager.getFocusSelection()?.cellRange;

      if (focusCellRange) {
        cell.coords = focusCellRange.highlight;
        cell.TD = this.#wtTable.getCell(cell.coords) as HTMLTableCellElement;
      }

    } else if (hasClass(elemEl, 'wtBorder') && hasClass(elemEl, 'area')) {
      const areaCellRange = this.#selectionManager.getAreaSelection()?.cellRange;

      if (areaCellRange) {
        cell.coords = areaCellRange.to;
        cell.TD = this.#wtTable.getCell(cell.coords) as HTMLTableCellElement;
      }
    }

    return cell;
  }

  /**
   * OnMouseDown callback.
   *
   * @private
   * @param event The mouse event object.
   */
  onMouseDown(event: MouseEvent | TouchEvent) {
    const activeElement = this.#domBindings.rootDocument.activeElement;
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
      this.#wtSettings.getSetting('onCellCornerMouseDown', event, realTarget);

    } else if (cell.TD) {
      this.#mouseDown = true;
      this.#mouseOverOutsideLastCoords = null;

      if (this.#wtSettings.has('onCellMouseDown')) {
        this.callListener('onCellMouseDown', event, cell.coords!, cell.TD);
      }
    }

    // doubleclick reacts only for left mouse button or from touch events
    if (((event as MouseEvent).button === 0 || this.touchApplied) && cell.TD) {
      this.#dblClickOrigin[0] = cell.TD;

      if (this.#dblClickTimeout[0] !== null) {
        clearTimeout(this.#dblClickTimeout[0]);
      }

      this.#dblClickTimeout[0] = setTimeout(() => {
        this.#dblClickOrigin[0] = null;
      }, 1000);
    }
  }

  /**
   * OnContextMenu callback.
   *
   * @private
   * @param event The mouse event object.
   */
  onContextMenu(event: MouseEvent) {
    this.#cancelLongPressTimer();

    if (this.#wtSettings.has('onCellContextMenu')) {
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
   * @param event The mouse event object.
   */
  onMouseOver(event: MouseEvent) {
    if (!this.#wtSettings.has('onCellMouseOver')) {
      return;
    }

    const table = this.#wtTable.TABLE;
    const td = closestDown(eventTargetEl(event)!, ['TD', 'TH'], table);
    const parent = this.#parent || this;

    if (td && td !== parent.lastMouseOver && isChildOf(td, table)) {
      parent.lastMouseOver = td;

      const tdCoords = this.#wtTable.getCoords(td);

      if (tdCoords) {
        this.callListener('onCellMouseOver', event, tdCoords, td);
      }
    }
  }

  /**
   * OnMouseMove callback.
   *
   * @private
   * @param event The mouse event object.
   */
  onMouseMove(event: MouseEvent) {
    if (!this.#mouseDown) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const = this.#getCellCoordsFromMousePosition(event.clientX, event.clientY);

    if (isOutside) {
      const lastCoords = this.#mouseOverOutsideLastCoords;

      if (!lastCoords || lastCoords.row !== coords.row || lastCoords.col !== coords.col) {
        const TD = this.#wtTable.getCell(coords);

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
   * @param mouseX Client X coordinate of the mouse.
   * @param mouseY Client Y coordinate of the mouse.
   * @returns }
   */
  #getCellCoordsFromMousePosition(mouseX: number, mouseY: number) {
    const isRtl = this.#wtSettings.getSetting<boolean>('rtlMode');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const wot = this.#facadeGetter();

    const numberOfFixedColumnsStart = this.#wtSettings.getSetting<number>('fixedColumnsStart');
    const numberOfFixedRowsTop = this.#wtSettings.getSetting<number>('fixedRowsTop');
    const numberOfFixedRowsBottom = this.#wtSettings.getSetting<number>('fixedRowsBottom');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const firstPartiallyVisibleRow: number = wot.wtScroll.getFirstPartiallyVisibleRow();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lastPartiallyVisibleRow: number = wot.wtScroll.getLastPartiallyVisibleRow();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const firstPartiallyVisibleColumn: number = wot.wtScroll.getFirstPartiallyVisibleColumn();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lastPartiallyVisibleColumn: number = wot.wtScroll.getLastPartiallyVisibleColumn();
    const tableOffset = this.#wtTable.wtRootElement.getBoundingClientRect();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const columnHeaderHeight: number = (this.#wtSettings.getSetting('columnHeaders') as unknown[]).length > 0
      ? wot.wtViewport.getColumnHeaderHeight() : 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rowHeaderWidth: number = (this.#wtSettings.getSetting('rowHeaders') as unknown[]).length > 0
      ? wot.wtViewport.getRowHeaderWidth() : 0;
    const = this.#domBindings;
    // When the window is the scroll container and tableOffset.left/top > 0 (e.g. RTL
    // at max-left scroll where tableOffset.left can exceed innerWidth), using it as the
    // clamp minimum causes clamp(min > max) to always return min, mapping every mouse
    // position to the wrong edge column. Math.min(0, tableOffset) corrects this while
    // preserving the original boundary when the table is partially off-screen to the
    // left/top (tableOffset < 0), which is the normal scrolled-past-origin case.
    const tableViewportLeft = wot.wtViewport.isHorizontallyScrollableByWindow()
      ? Math.min(0, tableOffset.left)
      : tableOffset.left;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tableViewportTop: number = wot.wtViewport.isVerticallyScrollableByWindow()
      ? Math.min(0, tableOffset.top)
      : tableOffset.top;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tableViewportRight: number = wot.wtViewport.isHorizontallyScrollableByWindow()
      ? rootWindow.innerWidth
      : tableOffset.left + wot.wtViewport.getViewportWidth() + rowHeaderWidth;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tableViewportBottom: number = wot.wtViewport.isVerticallyScrollableByWindow()
      ? rootWindow.innerHeight
      : tableOffset.top + wot.wtViewport.getViewportHeight() + columnHeaderHeight;

    const clampedX = clamp(mouseX, tableViewportLeft, tableViewportRight);
    const clampedY = clamp(mouseY, tableViewportTop, tableViewportBottom);

    let foundColumn = null;

    if (numberOfFixedColumnsStart > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fixedCell = wot.getCell({ row: firstPartiallyVisibleRow, col: 0 }, true);

      if (fixedCell instanceof HTMLElement) {
        const fixedCellRect = fixedCell.getBoundingClientRect();
        const fixedRelativeX = isRtl ? fixedCellRect.right - clampedX : clampedX - fixedCellRect.left;

        foundColumn = findColumnAtX(wot, firstPartiallyVisibleRow, 0, numberOfFixedColumnsStart - 1, fixedRelativeX);
      }
    }

    if (foundColumn === null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const scrollCell = wot.getCell({ row: firstPartiallyVisibleRow, col: firstPartiallyVisibleColumn }, true);

      if (scrollCell instanceof HTMLElement) {
        const scrollCellRect = scrollCell.getBoundingClientRect();
        const scrollRelativeX = isRtl ? scrollCellRect.right - clampedX : clampedX - scrollCellRect.left;

        foundColumn = findColumnAtX(
          wot,
          firstPartiallyVisibleRow,
          firstPartiallyVisibleColumn,
          lastPartiallyVisibleColumn,
          scrollRelativeX,
        );

        if (foundColumn === null) {
          foundColumn = scrollRelativeX < 0 ? firstPartiallyVisibleColumn : lastPartiallyVisibleColumn;
        }
      } else {
        foundColumn = firstPartiallyVisibleColumn;
      }
    }

    let foundRow = null;

    if (numberOfFixedRowsTop > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fixedCell = wot.getCell({ row: 0, col: firstPartiallyVisibleColumn }, true);

      if (fixedCell instanceof HTMLElement) {
        const fixedCellRect = fixedCell.getBoundingClientRect();
        const fixedRelativeY = clampedY - fixedCellRect.top;

        foundRow = findRowAtY(wot, firstPartiallyVisibleColumn, 0, numberOfFixedRowsTop - 1, fixedRelativeY);
      }
    }

    if (foundRow === null && numberOfFixedRowsBottom > 0) {
      const totalRows = this.#wtSettings.getSetting<number>('totalRows');
      const bottomStartRow = totalRows - numberOfFixedRowsBottom;
      const bottomEndRow = totalRows - 1;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fixedBottomCell = wot.getCell({ row: bottomStartRow, col: firstPartiallyVisibleColumn }, true);

      if (fixedBottomCell instanceof HTMLElement) {
        const fixedBottomCellRect = fixedBottomCell.getBoundingClientRect();
        const fixedBottomRelativeY = clampedY - fixedBottomCellRect.top;

        if (fixedBottomRelativeY >= 0) {
          foundRow = findRowAtY(wot, firstPartiallyVisibleColumn, bottomStartRow, bottomEndRow, fixedBottomRelativeY);

          if (foundRow === null) {
            foundRow = bottomEndRow;
          }
        }
      }
    }

    if (foundRow === null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const scrollCell = wot.getCell({ row: firstPartiallyVisibleRow, col: firstPartiallyVisibleColumn }, true);

      if (scrollCell instanceof HTMLElement) {
        const scrollCellRect = scrollCell.getBoundingClientRect();
        const scrollRelativeY = clampedY - scrollCellRect.top;

        foundRow = findRowAtY(
          wot,
          firstPartiallyVisibleColumn,
          firstPartiallyVisibleRow,
          lastPartiallyVisibleRow,
          scrollRelativeY,
        );

        if (foundRow === null) {
          foundRow = lastPartiallyVisibleRow;
        }
      } else {
        foundRow = firstPartiallyVisibleRow;
      }
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      coords: wot.createCellCoords(foundRow, foundColumn),
      isOutside: mouseX < tableViewportLeft ||
                 mouseX > tableViewportRight ||
                 mouseY < tableViewportTop ||
                 mouseY > tableViewportBottom,
    };
  }

  /**
   * OnMouseOut callback.
   *
   * @private
   * @param event The mouse event object.
   */
  onMouseOut(event: MouseEvent) {
    if (!this.#wtSettings.has('onCellMouseOut')) {
      return;
    }

    const table = this.#wtTable.TABLE;
    const lastTD = closestDown(eventTargetEl(event)!, ['TD', 'TH'], table);
    const nextTD = closestDown(event.relatedTarget as HTMLElement | null, ['TD', 'TH'], table);
    const parent = this.#parent || this;

    if (lastTD && lastTD !== nextTD && isChildOf(lastTD, table)) {
      const lastTDCoords = this.#wtTable.getCoords(lastTD);

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
   * @param event The mouse event object.
   */
  onMouseUp(event: MouseEvent | TouchEvent) {
    this.#mouseDown = false;
    this.#mouseOverOutsideLastCoords = null;

    const cell = this.parentCell(eventTargetEl(event));

    if (cell.TD && this.#wtSettings.has('onCellMouseUp')) {
      this.callListener('onCellMouseUp', event, cell.coords!, cell.TD);
    }

    // if not left mouse button, and the origin event is not comes from touch
    if ((event as MouseEvent).button !== 0 && !this.touchApplied) {
      return;
    }

    if (cell.TD && cell.TD === this.#dblClickOrigin[0] && cell.TD === this.#dblClickOrigin[1]) {
      if (hasClass(eventTargetEl(event)!, 'corner')) {
        this.callListener('onCellCornerDblClick', event, cell.coords!, cell.TD);
      } else {
        this.callListener('onCellDblClick', event, cell.coords!, cell.TD);
      }

      this.#dblClickOrigin[0] = null;
      this.#dblClickOrigin[1] = null;

    } else if (cell.TD && cell.TD === this.#dblClickOrigin[0]) {
      this.#dblClickOrigin[1] = cell.TD;

      if (this.#dblClickTimeout[1] !== null) {
        clearTimeout(this.#dblClickTimeout[1]);
      }

      this.#dblClickTimeout[1] = setTimeout(() => {
        this.#dblClickOrigin[1] = null;
      }, 500);
    }
  }

  /**
   * OnTouchStart callback. Captures the gesture start so the synthesized mousedown can be
   * deferred to `touchend`; this lets a touch-drag gesture scroll the grid without
   * re-triggering the cell selection (see issue #11659).
   *
   * @private
   * @param event The touch event object.
   */
  onTouchStart(event: TouchEvent) {
    this.#selectedCellBeforeTouchEnd = this.#selectionManager.getFocusSelection()?.cellRange ?? null;
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
   * @param event The touch event object.
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
    const isEventCancelable = event.cancelable && isCellsRange && this.#wtSettings.getSetting('isDataViewInstance');

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
      this.onMouseUp(event);
    }

    this.touchApplied = false;
    this.#touchWasMoved = false;
    this.#longPressFired = false;
  }

  /**
   * Starts the long-press timer. When the timer fires, a synthetic `contextmenu` event is
   * dispatched on the original touch target so that the existing contextmenu hook chain
   * (and ContextMenu plugin) work without changes.
   *
   * @private
   * @param event The original `touchstart` event.
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
      this.#wtSettings.getSetting('onBeforeTouchScroll');
    }
    this.momentumScrolling.ongoing = true;

    this.momentumScrolling._timeout = setTimeout(() => {
      if (!this.touchApplied) {
        this.momentumScrolling.ongoing = false;

        this.#wtSettings.getSetting('onAfterMomentumScroll');
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
   * @param event The touch event object.
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
   * @param name Name of listener.
   * @param event The event object.
   * @param coords Coordinates.
   * @param target Event target.
   */
  callListener(name: string, event: Event | MouseEvent | TouchEvent, coords: CellCoords, target: HTMLElement) {
    type ListenerFn = (
      event: Event | MouseEvent | TouchEvent, coords: CellCoords, target: HTMLElement, facade: unknown) => void;
    const listener = this.#wtSettings.getSettingPure(name) as ListenerFn | undefined;

    if (listener) {
      listener(event, coords, target, this.#facadeGetter());
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

    this.#eventManager.destroy();
  }
}

export default Event;
