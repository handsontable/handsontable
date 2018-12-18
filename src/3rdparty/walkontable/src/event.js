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

/**
 *
 */
function Event(instance) {
  const that = this;
  const eventManager = new EventManager(instance);
  let selectedCellBeforeTouchEnd;

<<<<<<< HEAD
  this.instance = instance;

  const dblClickOrigin = [null, null];
  this.dblClickTimeout = [null, null];
=======
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

    this.eventManager.addEventListener(window, 'resize', () => {
      if (this.instance.getSetting('stretchH') !== 'none') {
        this.instance.draw();
      }
    });
  }
>>>>>>> e75d08f4f... Fix unresponsive selection (#5678)

  const selectedCellWasTouched = (touchTarget) => {
    const cellUnderFinger = that.parentCell(touchTarget);
    const coordsOfCellUnderFinger = cellUnderFinger.coords;

    if (selectedCellBeforeTouchEnd && coordsOfCellUnderFinger) {
      const [rowTouched, rowSelected] = [coordsOfCellUnderFinger.row, selectedCellBeforeTouchEnd.from.row];
      const [colTouched, colSelected] = [coordsOfCellUnderFinger.col, selectedCellBeforeTouchEnd.from.col];

      return rowTouched === rowSelected && colTouched === colSelected;
    }

    return false;
  };

  const onMouseDown = function(event) {
    const activeElement = document.activeElement;
    const getParentNode = partial(getParent, event.realTarget);
    const realTarget = event.realTarget;

    // ignore focusable element from mouse down processing (https://github.com/handsontable/handsontable/issues/3555)
    if (realTarget === activeElement ||
        getParentNode(0) === activeElement ||
        getParentNode(1) === activeElement) {
      return;
    }

    const cell = that.parentCell(realTarget);

    if (hasClass(realTarget, 'corner')) {
      that.instance.getSetting('onCellCornerMouseDown', event, realTarget);
    } else if (cell.TD) {
      if (that.instance.hasSetting('onCellMouseDown')) {
        that.instance.getSetting('onCellMouseDown', event, cell.coords, cell.TD, that.instance);
      }
    }

    if (event.button !== 2) { // if not right mouse button
      if (cell.TD) {
        dblClickOrigin[0] = cell.TD;
        clearTimeout(that.dblClickTimeout[0]);
        that.dblClickTimeout[0] = setTimeout(() => {
          dblClickOrigin[0] = null;
        }, 1000);
      }
    }
  };

  const onContextMenu = function(event) {
    if (that.instance.hasSetting('onCellContextMenu')) {
      const cell = that.parentCell(event.realTarget);

      if (cell.TD) {
        that.instance.getSetting('onCellContextMenu', event, cell.coords, cell.TD, that.instance);
      }
    }
  };

  const onMouseOver = function(event) {
    let table;
    let td;
    let mainWOT;

    if (that.instance.hasSetting('onCellMouseOver')) {
      table = that.instance.wtTable.TABLE;
      td = closestDown(event.realTarget, ['TD', 'TH'], table);
      mainWOT = that.instance.cloneSource || that.instance;

      if (td && td !== mainWOT.lastMouseOver && isChildOf(td, table)) {
        mainWOT.lastMouseOver = td;

        that.instance.getSetting('onCellMouseOver', event, that.instance.wtTable.getCoords(td), td, that.instance);
      }
    }
  };

  const onMouseOut = function(event) {
    let table;
    let lastTD;
    let nextTD;

    if (that.instance.hasSetting('onCellMouseOut')) {
      table = that.instance.wtTable.TABLE;
      lastTD = closestDown(event.realTarget, ['TD', 'TH'], table);
      nextTD = closestDown(event.relatedTarget, ['TD', 'TH'], table);

      if (lastTD && lastTD !== nextTD && isChildOf(lastTD, table)) {
        that.instance.getSetting('onCellMouseOut', event, that.instance.wtTable.getCoords(lastTD), lastTD, that.instance);
      }
    }
  };

  const onMouseUp = function(event) {
    if (event.button !== 2) { // if not right mouse button
      const cell = that.parentCell(event.realTarget);

      if (cell.TD && that.instance.hasSetting('onCellMouseUp')) {
        that.instance.getSetting('onCellMouseUp', event, cell.coords, cell.TD, that.instance);
      }

      if (cell.TD === dblClickOrigin[0] && cell.TD === dblClickOrigin[1]) {
        if (hasClass(event.realTarget, 'corner')) {
          that.instance.getSetting('onCellCornerDblClick', event, cell.coords, cell.TD, that.instance);
        } else {
          that.instance.getSetting('onCellDblClick', event, cell.coords, cell.TD, that.instance);
        }

        dblClickOrigin[0] = null;
        dblClickOrigin[1] = null;

      } else if (cell.TD === dblClickOrigin[0]) {
        dblClickOrigin[1] = cell.TD;

        clearTimeout(that.dblClickTimeout[1]);

        that.dblClickTimeout[1] = setTimeout(() => {
          dblClickOrigin[1] = null;
        }, 500);
      }
    }
  };

<<<<<<< HEAD
  const onTouchStart = function(event) {
    onMouseDown(event);
  };
=======
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
>>>>>>> e75d08f4f... Fix unresponsive selection (#5678)

  const onTouchEnd = function(event) {
    const excludeTags = ['A', 'BUTTON', 'INPUT'];
    const target = event.target;

    this.instance.touchApplied = false;

    // When the standard event was performed on the link element (a cell which contains HTML `a` element) then here
    // we check if it should be canceled. Click is blocked in a situation when the element is rendered outside
    // selected cells. This prevents accidentally page reloads while selecting adjacent cells.
    if (selectedCellWasTouched(target) === false && excludeTags.includes(target.tagName)) {
      event.preventDefault();
    }
    onMouseUp(event);
  };

  eventManager.addEventListener(this.instance.wtTable.holder, 'contextmenu', onContextMenu);
  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseover', onMouseOver);
  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseout', onMouseOut);

  if (isTouchSupported()) {
    const onTouchStartProxy = function(event) {
      selectedCellBeforeTouchEnd = instance.selections.getCell().cellRange;
      that.instance.touchApplied = true;

      onTouchStart(event);
    };
    const onTouchEndProxy = function(event) {
      that.instance.touchApplied = false;

      onTouchEnd(event);
    };

    eventManager.addEventListener(this.instance.wtTable.holder, 'touchstart', onTouchStartProxy);
    eventManager.addEventListener(this.instance.wtTable.holder, 'touchend', onTouchEndProxy);

    if (!that.instance.momentumScrolling) {
      that.instance.momentumScrolling = {};
    }
    eventManager.addEventListener(this.instance.wtTable.holder, 'scroll', () => {
      clearTimeout(that.instance.momentumScrolling._timeout);

      if (!that.instance.momentumScrolling.ongoing) {
        that.instance.getSetting('onBeforeTouchScroll');
      }
      that.instance.momentumScrolling.ongoing = true;

      that.instance.momentumScrolling._timeout = setTimeout(() => {
        if (!that.instance.touchApplied) {
          that.instance.momentumScrolling.ongoing = false;

          that.instance.getSetting('onAfterMomentumScroll');
        }
      }, 200);
    });
  } else {
    eventManager.addEventListener(this.instance.wtTable.holder, 'mouseup', onMouseUp);
    eventManager.addEventListener(this.instance.wtTable.holder, 'mousedown', onMouseDown);
  }

  eventManager.addEventListener(window, 'resize', () => {
    if (that.instance.getSetting('stretchH') !== 'none') {
      that.instance.draw();
    }
  });

  this.destroy = function() {
    clearTimeout(this.dblClickTimeout[0]);
    clearTimeout(this.dblClickTimeout[1]);

    eventManager.destroy();
  };
}

Event.prototype.parentCell = function(elem) {
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
};

export default Event;
