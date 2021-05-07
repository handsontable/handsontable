import {
  closestDown,
  hasClass,
  isChildOf,
  getParent,
} from './../../../helpers/dom/element';
import { partial } from './../../../helpers/function';
import { isTouchSupported } from './../../../helpers/feature';
import { isMobileBrowser, isChromeWebKit, isFirefoxWebKit, isIOS } from './../../../helpers/browser';
import EventManager from './../../../eventManager';
import { isDefined } from '../../../helpers/mixed';

const privatePool = new WeakMap();

/**
 * @class Event
 */
class Event {
  /**
   * @param {*} instance Walkontable instance.
   */
  constructor(instance) {
    /**
     * Instance of {@link Walkontable}.
     *
     * @private
     * @type {Walkontable}
     */
    this.instance = instance;
    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(instance);

    privatePool.set(this, {
      selectedCellBeforeTouchEnd: void 0,
      dblClickTimeout: [null, null],
      dblClickOrigin: [null, null],
    });

    this.registerEvents();
  }

  /**
   * Adds listeners for mouse and touch events.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.instance.wtTable.holder, 'contextmenu', event => this.onContextMenu(event));
    this.eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseover', event => this.onMouseOver(event));
    this.eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseout', event => this.onMouseOut(event));

    const initTouchEvents = () => {
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'touchstart', event => this.onTouchStart(event));
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'touchend', event => this.onTouchEnd(event));

      if (!this.instance.momentumScrolling) {
        this.instance.momentumScrolling = {};
      }
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'scroll', () => {
        clearTimeout(this.instance.momentumScrolling._timeout);

        if (!this.instance.momentumScrolling.ongoing) {
          this.instance.getSetting('onBeforeTouchScroll');
        }
        this.instance.momentumScrolling.ongoing = true;

        this.instance.momentumScrolling._timeout = setTimeout(() => {
          if (!this.instance.touchApplied) {
            this.instance.momentumScrolling.ongoing = false;

            this.instance.getSetting('onAfterMomentumScroll');
          }
        }, 200);
      });
    };

    const initMouseEvents = () => {
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'mouseup', event => this.onMouseUp(event));
      this.eventManager.addEventListener(this.instance.wtTable.holder, 'mousedown', event => this.onMouseDown(event));
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
  selectedCellWasTouched(touchTarget) {
    const priv = privatePool.get(this);
    const cellUnderFinger = this.parentCell(touchTarget);
    const coordsOfCellUnderFinger = cellUnderFinger.coords;

    if (priv.selectedCellBeforeTouchEnd && coordsOfCellUnderFinger) {
      const [rowTouched, rowSelected] = [coordsOfCellUnderFinger.row, priv.selectedCellBeforeTouchEnd.from.row];
      const [colTouched, colSelected] = [coordsOfCellUnderFinger.col, priv.selectedCellBeforeTouchEnd.from.col];

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
  parentCell(elem) {
    const cell = {};
    const TABLE = this.instance.wtTable.TABLE;
    const TD = closestDown(elem, ['TD', 'TH'], TABLE);

    if (TD) {
      cell.coords = this.instance.wtTable.getCoords(TD);
      cell.TD = TD;

    } else if (hasClass(elem, 'wtBorder') && hasClass(elem, 'current')) {
      cell.coords = this.instance.selections.getCell().cellRange.highlight;
      cell.TD = this.instance.wtTable.getCell(cell.coords);

    } else if (hasClass(elem, 'wtBorder') && hasClass(elem, 'area')) {
      if (this.instance.selections.createOrGetArea().cellRange) {
        cell.coords = this.instance.selections.createOrGetArea().cellRange.to;
        cell.TD = this.instance.wtTable.getCell(cell.coords);
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
  onMouseDown(event) {
    const priv = privatePool.get(this);
    const activeElement = this.instance.rootDocument.activeElement;
    const getParentNode = partial(getParent, event.target);
    const realTarget = event.target;

    // ignore focusable element from mouse down processing (https://github.com/handsontable/handsontable/issues/3555)
    if (realTarget === activeElement ||
        getParentNode(0) === activeElement ||
        getParentNode(1) === activeElement) {
      return;
    }

    const cell = this.parentCell(realTarget);

    if (hasClass(realTarget, 'corner')) {
      this.instance.getSetting('onCellCornerMouseDown', event, realTarget);
    } else if (cell.TD && this.instance.hasSetting('onCellMouseDown')) {
      this.instance.getSetting('onCellMouseDown', event, cell.coords, cell.TD, this.instance);
    }

    // doubleclick reacts only for left mouse button or from touch events
    if ((event.button === 0 || this.instance.touchApplied) && cell.TD) {
      priv.dblClickOrigin[0] = cell.TD;

      clearTimeout(priv.dblClickTimeout[0]);

      priv.dblClickTimeout[0] = setTimeout(() => {
        priv.dblClickOrigin[0] = null;
      }, 1000);
    }
  }

  /**
   * OnContextMenu callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onContextMenu(event) {
    if (this.instance.hasSetting('onCellContextMenu')) {
      const cell = this.parentCell(event.target);

      if (cell.TD) {
        this.instance.getSetting('onCellContextMenu', event, cell.coords, cell.TD, this.instance);
      }
    }
  }

  /**
   * OnMouseOver callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseOver(event) {
    if (!this.instance.hasSetting('onCellMouseOver')) {
      return;
    }

    const table = this.instance.wtTable.TABLE;
    const td = closestDown(event.target, ['TD', 'TH'], table);
    const mainWOT = this.instance.cloneSource || this.instance;

    if (td && td !== mainWOT.lastMouseOver && isChildOf(td, table)) {
      mainWOT.lastMouseOver = td;

      this.instance.getSetting('onCellMouseOver', event, this.instance.wtTable.getCoords(td), td, this.instance);
    }
  }

  /**
   * OnMouseOut callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseOut(event) {
    if (!this.instance.hasSetting('onCellMouseOut')) {
      return;
    }

    const table = this.instance.wtTable.TABLE;
    const lastTD = closestDown(event.target, ['TD', 'TH'], table);
    const nextTD = closestDown(event.relatedTarget, ['TD', 'TH'], table);

    if (lastTD && lastTD !== nextTD && isChildOf(lastTD, table)) {
      this.instance.getSetting('onCellMouseOut', event, this.instance.wtTable.getCoords(lastTD), lastTD, this.instance);
    }
  }

  /**
   * OnMouseUp callback.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onMouseUp(event) {
    const priv = privatePool.get(this);
    const cell = this.parentCell(event.target);

    if (cell.TD && this.instance.hasSetting('onCellMouseUp')) {
      this.instance.getSetting('onCellMouseUp', event, cell.coords, cell.TD, this.instance);
    }

    // if not left mouse button, and the origin event is not comes from touch
    if (event.button !== 0 && !this.instance.touchApplied) {
      return;
    }

    if (cell.TD === priv.dblClickOrigin[0] && cell.TD === priv.dblClickOrigin[1]) {
      if (hasClass(event.target, 'corner')) {
        this.instance.getSetting('onCellCornerDblClick', event, cell.coords, cell.TD, this.instance);
      } else {
        this.instance.getSetting('onCellDblClick', event, cell.coords, cell.TD, this.instance);
      }

      priv.dblClickOrigin[0] = null;
      priv.dblClickOrigin[1] = null;

    } else if (cell.TD === priv.dblClickOrigin[0]) {
      priv.dblClickOrigin[1] = cell.TD;

      clearTimeout(priv.dblClickTimeout[1]);

      priv.dblClickTimeout[1] = setTimeout(() => {
        priv.dblClickOrigin[1] = null;
      }, 500);
    }
  }

  /**
   * OnTouchStart callback. Simulates mousedown event.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onTouchStart(event) {
    const priv = privatePool.get(this);

    priv.selectedCellBeforeTouchEnd = this.instance.selections.getCell().cellRange;
    this.instance.touchApplied = true;

    this.onMouseDown(event);
  }

  /**
   * OnTouchEnd callback. Simulates mouseup event.
   *
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  onTouchEnd(event) {
    const target = event.target;
    const parentCellCoords = this.parentCell(target)?.coords;
    const isCellsRange = isDefined(parentCellCoords) && (parentCellCoords.row >= 0 && parentCellCoords.col >= 0);
    const isEventCancelable = event.cancelable && isCellsRange && this.instance.getSetting('isDataViewInstance');

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
          !interactiveElements.includes(target.tagName)) {
        event.preventDefault();

      } else if (!this.selectedCellWasTouched(target)) {
        // For other browsers, prevent default is fired only for the first tap and only when the previous
        // highlighted cell was different.
        event.preventDefault();
      }
    }

    this.onMouseUp(event);

    this.instance.touchApplied = false;
  }

  /**
   * Clears double-click timeouts and destroys the internal eventManager instance.
   */
  destroy() {
    const priv = privatePool.get(this);

    clearTimeout(priv.dblClickTimeout[0]);
    clearTimeout(priv.dblClickTimeout[1]);

    this.eventManager.destroy();
  }
}

export default Event;
