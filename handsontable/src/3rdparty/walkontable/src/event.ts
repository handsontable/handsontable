import type { CellCoords, CellRange, DomBindings, WtSettings, WtTable } from '../../../common';
import type { SelectionManager } from './selection/manager';
import {
  closestDown,
  hasClass,
  isChildOf,
  getParent,
} from '../../../helpers/dom/element';
import { partial } from '../../../helpers/function';
import { isTouchSupported } from '../../../helpers/feature';
import { isMobileBrowser, isChromeWebKit, isFirefoxWebKit, isIOS } from '../../../helpers/browser';
import { isDefined } from '../../../helpers/mixed';

/**
 * @class Event
 */
class Event {
  declare momentumScrolling: { ongoing?: boolean; _timeout?: ReturnType<typeof setTimeout> };
  declare touchApplied: boolean;
  declare lastMouseOver: HTMLElement | null;

  #wtSettings;
  #domBindings;
  #wtTable;
  #selectionManager: SelectionManager;
  #parent;
  /**
   * Instance of {@link EventManager}.
   *
   * @type {EventManager}
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
   * @type {FacadeGetter}
   */
  #facadeGetter;
  /**
   * @type {boolean}
   */
  #selectedCellBeforeTouchEnd: CellRange | null;
  /**
   * @type {number[]}
   */
  #dblClickTimeout: (ReturnType<typeof setTimeout> | null)[] = [null, null];
  /**
   * @type {number[]}
   */
  #dblClickOrigin: (HTMLElement | null)[] = [null, null];

  /**
   * @param {FacadeGetter} facadeGetter Gets an instance facade.
   * @param {DomBindings} domBindings Bindings into dom.
   * @param {Settings} wtSettings The walkontable settings.
   * @param {EventManager} eventManager The walkontable event manager.
   * @param {Table} wtTable The table.
   * @param {SelectionManager} selectionManager Selections.
   * @param {Event} [parent=null] The main Event instance.
   */
  constructor(facadeGetter: Function, domBindings: DomBindings, wtSettings: WtSettings, eventManager: Record<string, Function>, wtTable: WtTable, selectionManager: SelectionManager, parent: Event | null = null) {
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
    this.#eventManager.addEventListener(this.#wtTable.holder, 'contextmenu', (event: MouseEvent) => this.onContextMenu(event));
    this.#eventManager.addEventListener(this.#wtTable.TABLE, 'mouseover', (event: MouseEvent) => this.onMouseOver(event));
    this.#eventManager.addEventListener(this.#wtTable.TABLE, 'mouseout', (event: MouseEvent) => this.onMouseOut(event));

    const initTouchEvents = () => {
      this.#eventManager.addEventListener(this.#wtTable.holder, 'touchstart', (event: TouchEvent) => this.onTouchStart(event));
      this.#eventManager.addEventListener(this.#wtTable.holder, 'touchend', (event: TouchEvent) => this.onTouchEnd(event));

      if (!this.momentumScrolling) {
        this.momentumScrolling = {};
      }
      this.#eventManager.addEventListener(this.#wtTable.holder, 'scroll', () => {
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
      });
    };

    const initMouseEvents = () => {
      this.#eventManager.addEventListener(this.#wtTable.holder, 'mouseup', (event: MouseEvent) => this.onMouseUp(event));
      this.#eventManager.addEventListener(this.#wtTable.holder, 'mousedown', (event: MouseEvent) => this.onMouseDown(event));
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
    const TABLE = this.#wtTable.TABLE;
    const TD = closestDown(elem, ['TD', 'TH'], TABLE);

    if (TD) {
      cell.coords = this.#wtTable.getCoords(TD as HTMLElement);
      cell.TD = TD as HTMLTableCellElement;

    } else if (hasClass(elem as HTMLElement, 'wtBorder') && hasClass(elem as HTMLElement, 'current')) {
      cell.coords = this.#selectionManager.getFocusSelection().cellRange.highlight;
      cell.TD = this.#wtTable.getCell(cell.coords) as HTMLTableCellElement;

    } else if (hasClass(elem as HTMLElement, 'wtBorder') && hasClass(elem as HTMLElement, 'area')) {
      if (this.#selectionManager.getAreaSelection().cellRange) {
        cell.coords = this.#selectionManager.getAreaSelection().cellRange.to;
        cell.TD = this.#wtTable.getCell(cell.coords) as HTMLTableCellElement;
      }
    }

    return cell;
  }

  /**
   * OnMouseDown callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseDown(event: MouseEvent | TouchEvent) {
    const activeElement = this.#domBindings.rootDocument.activeElement;
    const getParentNode = partial(getParent, event.target as any);
    const realTarget = event.target as Element;

    // ignore non-TD focusable elements from mouse down processing
    // (https://github.com/handsontable/handsontable/issues/3555)
    if (!['TD', 'TH'].includes(activeElement.nodeName) &&
      (
        realTarget === activeElement ||
        getParentNode(0) === activeElement ||
        getParentNode(1) === activeElement
      )
    ) {
      return;
    }

    const cell = this.parentCell(realTarget);

    if (hasClass(realTarget as HTMLElement, 'corner')) {
      this.#wtSettings.getSetting('onCellCornerMouseDown', event, realTarget);

    } else if (cell.TD && this.#wtSettings.has('onCellMouseDown')) {
      this.callListener('onCellMouseDown', event, cell.coords!, cell.TD);
    }

    // doubleclick reacts only for left mouse button or from touch events
    if (((event as MouseEvent).button === 0 || this.touchApplied) && cell.TD) {
      this.#dblClickOrigin[0] = cell.TD as HTMLElement;

      clearTimeout(this.#dblClickTimeout[0]);

      this.#dblClickTimeout[0] = setTimeout(() => {
        this.#dblClickOrigin[0] = null;
      }, 1000);
    }
  }

  /**
   * OnContextMenu callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onContextMenu(event: MouseEvent) {
    if (this.#wtSettings.has('onCellContextMenu')) {
      const cell = this.parentCell(event.target as Element);

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
    if (!this.#wtSettings.has('onCellMouseOver')) {
      return;
    }

    const table = this.#wtTable.TABLE;
    const td = closestDown(event.target as HTMLElement, ['TD', 'TH'], table);
    const parent = this.#parent || this;

    if (td && td !== parent.lastMouseOver && isChildOf(td as HTMLElement, table)) {
      parent.lastMouseOver = td as HTMLElement;

      this.callListener('onCellMouseOver', event, this.#wtTable.getCoords(td as HTMLElement), td as HTMLElement);
    }
  }

  /**
   * OnMouseOut callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseOut(event: MouseEvent) {
    if (!this.#wtSettings.has('onCellMouseOut')) {
      return;
    }

    const table = this.#wtTable.TABLE;
    const lastTD = closestDown(event.target as HTMLElement, ['TD', 'TH'], table);
    const nextTD = closestDown(event.relatedTarget as HTMLElement, ['TD', 'TH'], table);
    const parent = this.#parent || this;

    if (lastTD && lastTD !== nextTD && isChildOf(lastTD as HTMLElement, table)) {
      this.callListener('onCellMouseOut', event, this.#wtTable.getCoords(lastTD as HTMLElement), lastTD as HTMLElement);

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
    const cell = this.parentCell(event.target as Element);

    if (cell.TD && this.#wtSettings.has('onCellMouseUp')) {
      this.callListener('onCellMouseUp', event, cell.coords!, cell.TD);
    }

    // if not left mouse button, and the origin event is not comes from touch
    if ((event as MouseEvent).button !== 0 && !this.touchApplied) {
      return;
    }

    if (cell.TD && cell.TD === this.#dblClickOrigin[0] && cell.TD === this.#dblClickOrigin[1]) {
      if (hasClass(event.target as HTMLElement, 'corner')) {
        this.callListener('onCellCornerDblClick', event, cell.coords!, cell.TD);
      } else {
        this.callListener('onCellDblClick', event, cell.coords!, cell.TD);
      }

      this.#dblClickOrigin[0] = null;
      this.#dblClickOrigin[1] = null;

    } else if (cell.TD && cell.TD === this.#dblClickOrigin[0]) {
      this.#dblClickOrigin[1] = cell.TD as HTMLElement;

      clearTimeout(this.#dblClickTimeout[1]);

      this.#dblClickTimeout[1] = setTimeout(() => {
        this.#dblClickOrigin[1] = null;
      }, 500);
    }
  }

  /**
   * OnTouchStart callback. Simulates mousedown event.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onTouchStart(event: TouchEvent) {
    this.#selectedCellBeforeTouchEnd = this.#selectionManager.getFocusSelection().cellRange;
    this.touchApplied = true;

    this.onMouseDown(event);
  }

  /**
   * OnTouchEnd callback. Simulates mouseup event.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onTouchEnd(event: TouchEvent) {
    const target = event.target as Element;
    const parentCellCoords = this.parentCell(target)?.coords;
    const isCellsRange = isDefined(parentCellCoords) && (parentCellCoords.row >= 0 && parentCellCoords.col >= 0);
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
          !interactiveElements.includes((target as HTMLElement).tagName)) {
        event.preventDefault();

      } else if (!this.selectedCellWasTouched(target)) {
        // For other browsers, prevent default is fired only for the first tap and only when the previous
        // highlighted cell was different.
        event.preventDefault();
      }
    }

    this.onMouseUp(event);

    this.touchApplied = false;
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
    const listener = this.#wtSettings.getSettingPure(name) as Function;

    if (listener) {
      listener(event, coords, target, this.#facadeGetter());
    }
  }

  /**
   * Clears double-click timeouts and destroys the internal eventManager instance.
   */
  destroy() {
    clearTimeout(this.#dblClickTimeout[0]);
    clearTimeout(this.#dblClickTimeout[1]);

    this.#eventManager.destroy();
  }
}

export default Event;
