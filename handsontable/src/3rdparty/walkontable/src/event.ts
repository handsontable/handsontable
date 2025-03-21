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
import { 
  DomBindings, 
  EventManager, 
  FacadeGetter, 
  Settings
} from './types';

/**
 * @class Event
 */
class Event {
  #wtSettings: Settings;
  #domBindings: DomBindings;
  #wtTable: any;
  #selectionManager: any;
  #parent: any;
  /**
   * Instance of {@link EventManager}.
   *
   * @type {EventManager}
   */
  #eventManager: EventManager;
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
  #facadeGetter: FacadeGetter;
  /**
   * @type {boolean}
   */
  #selectedCellBeforeTouchEnd: boolean;
  #dblClickTimeout: number | null;
  #dblClickOrigin: number[] | null;
  #onMouseDown: (event: MouseEvent) => void;
  #onTouchStart: (event: TouchEvent) => void;
  #onTouchEnd: (event: TouchEvent) => void;
  #onDblClick: (event: MouseEvent) => void;

  /**
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   * @param {object} wtTable The Walkontable instance.
   * @param {SelectionManager} selectionManager Handsontable selection manager.
   * @param {EventManager} eventManager Walkontable event manager.
   * @param {object} wtScroll The Walkontable scroll.
   * @param {FacadeGetter} facadeGetter Function which returns proper facade.
   */
  constructor(
    wtSettings: Settings,
    domBindings: DomBindings,
    wtTable: any, 
    selectionManager: any, 
    eventManager: EventManager, 
    wtScroll: any, 
    facadeGetter: FacadeGetter
  ) {
    this.#wtSettings = wtSettings;
    this.#domBindings = domBindings;
    this.#wtTable = wtTable;
    this.#selectionManager = selectionManager;

    this.#eventManager = eventManager;
    this.#parent = this.#wtTable.parent;
    this.#facadeGetter = facadeGetter;
    this.#selectedCellBeforeTouchEnd = false;
    this.#dblClickTimeout = null;
    this.#dblClickOrigin = null;

    this.#onMouseDown = this.#onMouseDownDraw.bind(this);
    this.#onTouchStart = this.#onTouchStartDraw.bind(this);
    this.#onTouchEnd = this.#onTouchEndDraw.bind(this);
    this.#onDblClick = this.#onDblClickDraw.bind(this);
    
    this.#registerEvents();
  }

  /**
   * Binds all necessary events for walkontable.
   */
  #registerEvents(): void {
    this.#eventManager.addEventListener(this.#domBindings.rootTable, 'mousedown', this.#onMouseDown);

    if (isMobileBrowser()) {
      this.#eventManager.addEventListener(this.#domBindings.rootTable, 'touchstart', this.#onTouchStart);
      this.#eventManager.addEventListener(this.#domBindings.rootTable, 'touchend', this.#onTouchEnd);
    } else {
      this.#eventManager.addEventListener(this.#domBindings.rootTable, 'dblclick', this.#onDblClick);
    }
  }

  /**
   * Unbinds all necessary events from walkontable instance.
   */
  destroy(): void {
    this.#eventManager.removeEventListener(this.#domBindings.rootTable, 'mousedown', this.#onMouseDown);

    if (isMobileBrowser()) {
      this.#eventManager.removeEventListener(this.#domBindings.rootTable, 'touchstart', this.#onTouchStart);
      this.#eventManager.removeEventListener(this.#domBindings.rootTable, 'touchend', this.#onTouchEnd);
    } else {
      this.#eventManager.removeEventListener(this.#domBindings.rootTable, 'dblclick', this.#onDblClick);
    }
  }

  /**
   * When the onMouseDown callback is triggered by event on a cell, then select that cell.
   *
   * @param {MouseEvent} event Mouse event.
   */
  #onMouseDownDraw(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const domBindings = this.#domBindings;
    const wtSettings = this.#wtSettings;
    const getParentNode = partial(getParent, target);
    const getTableParentNode = partial(getParent, domBindings.rootTable.parentNode);

    // Ignore the event triggered by scrollbars
    if (hasClass(target, 'dragdealer')) {
      return;
    }

    // ignore focusable element and their children (mainly it run only in the mozilla)
    if ((wtSettings.getSetting('preventOverflow') ||
         wtSettings.getSetting('preventTouchScroll')) &&
        target.nodeName === 'BUTTON') {
      return;
    }

    const targetIsThCornerCaption = hasClass(target, 'collapsibleIndicator');

    if (targetIsThCornerCaption && getParentNode(2) === domBindings.rootTable && getParentNode(1)?.nodeName === 'TH') {
      return;
    }

    const wtTable = this.#wtTable;
    const cell = wtTable.getCell(target);

    if (cell.TD && cell.TD === target && wtSettings.has('onCellMouseDown')) {
      wtSettings.getSetting('onCellMouseDown', event, cell.coords, cell.TD, this.#facadeGetter());
    }

    // Click on "sideways" (the left side) of the cell -> select a cell in a column header
    if (cell.TD && wtSettings.has('onCellMouseDown') && cell.TD !== target && cell.TD.contains(target)) {
      withinSideways: {
        if (hasClass(target, 'rowHeader')) {
          wtSettings.getSetting('onCellMouseDown', event, cell.coords, cell.TD, this.#facadeGetter());

          break withinSideways;
        }
      }
    }

    const getCoords = () => {
      const currentTarget = event.currentTarget as HTMLElement;

      if (hasClass(target, 'active')) {
        return this.#selectionManager.getSelectedRange().current();
      }

      const thisTdIndex = closestDown(target, ['TD'], currentTarget);
      const thisThIndex = closestDown(target, ['TH'], currentTarget);

      return wtTable.getCoords(thisTdIndex || thisThIndex);
    };

    // No cell clicked
    if (cell.TD === null && !targetIsThCornerCaption) {
      // Click on the column header or row header
      if (this.#wtSettings.getSetting('selectionMode') !== 'none') {
        const coords = getCoords();

        const targetClassList = target.classList;
        const targetNodeName = target.nodeName;
        const targetInnerHTML = target.innerHTML;

        if (coords) {
          if (!targetClassList.contains('collapsibleIndicator')) {
            this.#selectionManager.processSelection(coords, false);
          }
          if (wtSettings.has('onCellMouseDown')) {
            wtSettings.getSetting('onCellMouseDown', event, coords, target, this.#facadeGetter());
          }
        }
      }
    }
  }

  /**
   * When the double-click event occurs in the Walkontable, then select the cell, and if needed fire the
   * appropriate callback.
   *
   * @param {MouseEvent} event Mouse event.
   */
  #onDblClickDraw(event: MouseEvent): void {
    if (hasClass(event.target as HTMLElement, 'dragdealer')) {
      return;
    }

    // if not left mouse button, then return
    if (event.button !== 0) {
      return;
    }

    const wtTable = this.#wtTable;
    const cell = wtTable.getCell(event.target as HTMLElement);

    if (cell.TD && this.#wtSettings.has('onCellDblClick')) {
      this.#wtSettings.getSetting('onCellDblClick', event, cell.coords, cell.TD, this.#facadeGetter());
    }
  }

  /**
   * When the touchstart event occurs in the walkontable, then select the cell.
   *
   * @param {TouchEvent} event Touch event.
   */
  #onTouchStartDraw(event: TouchEvent): void {
    const target = event.target as HTMLElement;

    if (hasClass(target, 'dragdealer')) {
      return;
    }

    const wtTable = this.#wtTable;
    const cell = wtTable.getCell(target);

    if (cell.TD && this.#wtSettings.has('onCellMouseDown')) {
      const multipletouches = event.touches.length > 1;

      this.#wtSettings.getSetting('onCellMouseDown', event, cell.coords, cell.TD, this.#facadeGetter(), multipletouches);
    }

    this.#selectedCellBeforeTouchEnd = true;
  }

  /**
   * When the touchend event occurs in the walkontable, then fire the appropriate callback.
   *
   * @param {TouchEvent} event Touch event.
   */
  #onTouchEndDraw(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    const cellUnderFinger = this.#wtTable.getCell(target);

    if (this.#selectedCellBeforeTouchEnd && cellUnderFinger.TD && this.#wtSettings.has('onCellMouseUp')) {
      this.#wtSettings.getSetting('onCellMouseUp', event, cellUnderFinger.coords, cellUnderFinger.TD, this.#facadeGetter());
    }
    
    this.#selectedCellBeforeTouchEnd = false;

    if (hasClass(target, 'dragdealer')) {
      return;
    }

    // double tap on element (background of overlay, row/column header, table header, table or cell)
    const now = Date.now();
    const dblClickOrigin = this.#dblClickOrigin;
    let isDblTap = false;

    if (dblClickOrigin) {
      if (now - dblClickOrigin[2] < 500 &&
          ((dblClickOrigin[0] && dblClickOrigin[0] === target as any) ||
           (dblClickOrigin[1] && dblClickOrigin[1] === target as any)) &&
          dblClickOrigin[2] !== null) {
        isDblTap = true;
      }
      this.#dblClickOrigin = null;
    }

    this.#dblClickOrigin = [target as any, target as any, now];

    if (isDblTap) {
      const wtTable = this.#wtTable;
      const cell = wtTable.getCell(target);

      // TouchEvent doesn't have button property
      const isLeftClick = true;
      
      if (!isLeftClick) {
        return;
      }

      if (cell.TD && this.#wtSettings.has('onCellDblClick')) {
        this.#wtSettings.getSetting('onCellDblClick', event, cell.coords, cell.TD, this.#facadeGetter());
      }
    }
  }
}

export default Event;
