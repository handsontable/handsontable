import {
  closestDown,
  hasClass,
  isChildOf,
  getParent,
} from './../../../helpers/dom/element';
import {partial} from './../../../helpers/function';
import {isMobileBrowser} from './../../../helpers/browser';
import EventManager from './../../../eventManager';

/**
 *
 */
function Event(instance) {
  const that = this;
  const eventManager = new EventManager(instance);

  this.instance = instance;

  var dblClickOrigin = [null, null];
  this.dblClickTimeout = [null, null];

  var onMouseDown = function(event) {
    const activeElement = document.activeElement;
    const getParentNode = partial(getParent, event.realTarget);
    const realTarget = event.realTarget;

    // ignore focusable element from mouse down processing (https://github.com/handsontable/handsontable/issues/3555)
    if (realTarget === activeElement ||
        getParentNode(0) === activeElement ||
        getParentNode(1) === activeElement) {
      return;
    }

    var cell = that.parentCell(realTarget);

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

  var onTouchMove = function(event) {
    that.instance.touchMoving = true;
  };

  var longTouchTimeout;

  var onTouchStart = function(event) {
    var container = this;

    eventManager.addEventListener(this, 'touchmove', onTouchMove);

    // Prevent cell selection when scrolling with touch event - not the best solution performance-wise
    that.checkIfTouchMove = setTimeout(() => {
      if (that.instance.touchMoving === true) {
        that.instance.touchMoving = void 0;

        eventManager.removeEventListener('touchmove', onTouchMove, false);
      }

      onMouseDown(event);

    }, 30);
  };

  var onMouseOver = function(event) {
    var table,
      td,
      mainWOT;

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

  var onMouseOut = function(event) {
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

  var onMouseUp = function(event) {
    if (event.button !== 2) { // if not right mouse button
      var cell = that.parentCell(event.realTarget);

      if (cell.TD === dblClickOrigin[0] && cell.TD === dblClickOrigin[1]) {
        if (hasClass(event.realTarget, 'corner')) {
          that.instance.getSetting('onCellCornerDblClick', event, cell.coords, cell.TD, that.instance);

        } else {
          that.instance.getSetting('onCellDblClick', event, cell.coords, cell.TD, that.instance);
        }

        dblClickOrigin[0] = null;
        dblClickOrigin[1] = null;

      } else if (cell.TD === dblClickOrigin[0]) {
        that.instance.getSetting('onCellMouseUp', event, cell.coords, cell.TD, that.instance);

        dblClickOrigin[1] = cell.TD;
        clearTimeout(that.dblClickTimeout[1]);
        that.dblClickTimeout[1] = setTimeout(() => {
          dblClickOrigin[1] = null;
        }, 500);

      } else if (cell.TD && that.instance.hasSetting('onCellMouseUp')) {
        that.instance.getSetting('onCellMouseUp', event, cell.coords, cell.TD, that.instance);
      }
    }
  };

  var onTouchEnd = function(event) {
    clearTimeout(longTouchTimeout);
    // that.instance.longTouch == void 0;

    event.preventDefault();
    onMouseUp(event);

    // eventManager.removeEventListener(that.instance.wtTable.holder, "mouseup", onMouseUp);
  };

  eventManager.addEventListener(this.instance.wtTable.holder, 'mousedown', onMouseDown);
  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseover', onMouseOver);
  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseout', onMouseOut);
  eventManager.addEventListener(this.instance.wtTable.holder, 'mouseup', onMouseUp);

  // check if full HOT instance, or detached WOT AND run on mobile device
  if (this.instance.wtTable.holder.parentNode.parentNode && isMobileBrowser() && !that.instance.wtTable.isWorkingOnClone()) {
    var classSelector = `.${this.instance.wtTable.holder.parentNode.className.split(' ').join('.')}`;

    eventManager.addEventListener(this.instance.wtTable.holder, 'touchstart', (event) => {
      that.instance.touchApplied = true;
      if (isChildOf(event.target, classSelector)) {
        onTouchStart.call(event.target, event);
      }
    });
    eventManager.addEventListener(this.instance.wtTable.holder, 'touchend', (event) => {
      that.instance.touchApplied = false;
      if (isChildOf(event.target, classSelector)) {
        onTouchEnd.call(event.target, event);
      }
    });

    if (!that.instance.momentumScrolling) {
      that.instance.momentumScrolling = {};
    }
    eventManager.addEventListener(this.instance.wtTable.holder, 'scroll', (event) => {
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
  var cell = {};
  var TABLE = this.instance.wtTable.TABLE;
  var TD = closestDown(elem, ['TD', 'TH'], TABLE);

  if (TD) {
    cell.coords = this.instance.wtTable.getCoords(TD);
    cell.TD = TD;

  } else if (hasClass(elem, 'wtBorder') && hasClass(elem, 'current')) {
    cell.coords = this.instance.selections.current.cellRange.highlight; // selections.current is current selected cell
    cell.TD = this.instance.wtTable.getCell(cell.coords);

  } else if (hasClass(elem, 'wtBorder') && hasClass(elem, 'area')) {
    if (this.instance.selections.area.cellRange) {
      cell.coords = this.instance.selections.area.cellRange.to; // selections.area is area selected cells
      cell.TD = this.instance.wtTable.getCell(cell.coords);
    }
  }

  return cell;
};

export default Event;
