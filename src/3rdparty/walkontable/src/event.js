import {
  closestDown,
  hasClass,
  isChildOf,
  getParent,
} from './../../../helpers/dom/element';
import { partial } from './../../../helpers/function';
import { isTouchSupported } from './../../../helpers/feature';
import { isMobileBrowser } from './../../../helpers/browser';
import EventManager from './../../../eventManager';

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
   * @param {Element} touchTarget
   * @returns {Boolean}
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
   * @param {Element} elem
   * @returns {Object} Contains coordinates and reference to TD or TH if it exists. Otherwise it's empty object.
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
   * onMouseDown callback.
   *
   * @private
   * @param {MouseEvent} event
   */
  onMouseDown(event) {
    const priv = privatePool.get(this);
    const activeElement = this.instance.rootDocument.activeElement;
    const getParentNode = partial(getParent, event.realTarget);
    const realTarget = event.realTarget;

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
   * onContextMenu callback.
   *
   * @private
   * @param {MouseEvent} event
   */
  onContextMenu(event) {
    if (this.instance.hasSetting('onCellContextMenu')) {
      const cell = this.parentCell(event.realTarget);

      if (cell.TD) {
        this.instance.getSetting('onCellContextMenu', event, cell.coords, cell.TD, this.instance);
      }
    }
  }

  /**
   * onMouseOver callback.
   *
   * @private
   * @param {MouseEvent} event
   */
  onMouseOver(event) {
    if (!this.instance.hasSetting('onCellMouseOver')) {
      return;
    }

    const table = this.instance.wtTable.TABLE;
    const td = closestDown(event.realTarget, ['TD', 'TH'], table);
    const mainWOT = this.instance.cloneSource || this.instance;

    if (td && td !== mainWOT.lastMouseOver && isChildOf(td, table)) {
      mainWOT.lastMouseOver = td;

      this.instance.getSetting('onCellMouseOver', event, this.instance.wtTable.getCoords(td), td, this.instance);
    }
  }

  /**
   * onMouseOut callback.
   *
   * @private
   * @param {MouseEvent} event
   */
  onMouseOut(event) {
    if (!this.instance.hasSetting('onCellMouseOut')) {
      return;
    }

    const table = this.instance.wtTable.TABLE;
    const lastTD = closestDown(event.realTarget, ['TD', 'TH'], table);
    const nextTD = closestDown(event.relatedTarget, ['TD', 'TH'], table);

    if (lastTD && lastTD !== nextTD && isChildOf(lastTD, table)) {
      this.instance.getSetting('onCellMouseOut', event, this.instance.wtTable.getCoords(lastTD), lastTD, this.instance);
    }
  }

  /**
   * onMouseUp callback.
   *
   * @private
   * @param {MouseEvent} event
   */
  onMouseUp(event) {
    const priv = privatePool.get(this);
    const cell = this.parentCell(event.realTarget);

    if (cell.TD && this.instance.hasSetting('onCellMouseUp')) {
      this.instance.getSetting('onCellMouseUp', event, cell.coords, cell.TD, this.instance);
    }

    // if not left mouse button, and the origin event is not comes from touch
    if (event.button !== 0 && !this.instance.touchApplied) {
      return;
    }

    if (cell.TD === priv.dblClickOrigin[0] && cell.TD === priv.dblClickOrigin[1]) {
      if (hasClass(event.realTarget, 'corner')) {
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
   * onTouchStart callback. Simulates mousedown event.
   *
   * @private
   * @param {MouseEvent} event
   */
  onTouchStart(event) {
    const priv = privatePool.get(this);

    priv.selectedCellBeforeTouchEnd = this.instance.selections.getCell().cellRange;
    this.instance.touchApplied = true;

    this.onMouseDown(event);
  }

  /**
   * onTouchEnd callback. Simulates mouseup event.
   *
   * @private
   * @param {MouseEvent} event
   */
  onTouchEnd(event) {
    const excludeTags = ['A', 'BUTTON', 'INPUT'];
    const target = event.target;

    // When the standard event was performed on the link element (a cell which contains HTML `a` element) then here
    // we check if it should be canceled. Click is blocked in a situation when the element is rendered outside
    // selected cells. This prevents accidentally page reloads while selecting adjacent cells.
    if (this.selectedCellWasTouched(target) === false && excludeTags.includes(target.tagName)) {
      event.preventDefault();
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
