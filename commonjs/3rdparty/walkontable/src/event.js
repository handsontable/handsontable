'use strict';

exports.__esModule = true;

var _element = require('./../../../helpers/dom/element');

var _function = require('./../../../helpers/function');

var _browser = require('./../../../helpers/browser');

var _eventManager = require('./../../../eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *
 */
function Event(instance) {
  var that = this;
  var eventManager = new _eventManager2.default(instance);
  var selectedCellBeforeTouchEnd = void 0;

  this.instance = instance;

  var dblClickOrigin = [null, null];
  this.dblClickTimeout = [null, null];

  var onMouseDown = function onMouseDown(event) {
    var activeElement = document.activeElement;
    var getParentNode = (0, _function.partial)(_element.getParent, event.realTarget);
    var realTarget = event.realTarget;

    // ignore focusable element from mouse down processing (https://github.com/handsontable/handsontable/issues/3555)
    if (realTarget === activeElement || getParentNode(0) === activeElement || getParentNode(1) === activeElement) {
      return;
    }

    var cell = that.parentCell(realTarget);

    if ((0, _element.hasClass)(realTarget, 'corner')) {
      that.instance.getSetting('onCellCornerMouseDown', event, realTarget);
    } else if (cell.TD) {
      if (that.instance.hasSetting('onCellMouseDown')) {
        that.instance.getSetting('onCellMouseDown', event, cell.coords, cell.TD, that.instance);
      }
    }

    if (event.button !== 2) {
      // if not right mouse button
      if (cell.TD) {
        dblClickOrigin[0] = cell.TD;
        clearTimeout(that.dblClickTimeout[0]);
        that.dblClickTimeout[0] = setTimeout(function () {
          dblClickOrigin[0] = null;
        }, 1000);
      }
    }
  };

  var onContextMenu = function onContextMenu(event) {
    if (that.instance.hasSetting('onCellContextMenu')) {
      var cell = that.parentCell(event.realTarget);

      if (cell.TD) {
        that.instance.getSetting('onCellContextMenu', event, cell.coords, cell.TD, that.instance);
      }
    }
  };

  var onTouchMove = function onTouchMove() {
    that.instance.touchMoving = true;
  };

  var onTouchStart = function onTouchStart(event) {
    eventManager.addEventListener(this, 'touchmove', onTouchMove);

    // Prevent cell selection when scrolling with touch event - not the best solution performance-wise
    that.checkIfTouchMove = setTimeout(function () {
      if (that.instance.touchMoving === true) {
        that.instance.touchMoving = void 0;

        eventManager.removeEventListener('touchmove', onTouchMove, false);
      }

      onMouseDown(event);
    }, 30);
  };

  var onMouseOver = function onMouseOver(event) {
    var table = void 0;
    var td = void 0;
    var mainWOT = void 0;

    if (that.instance.hasSetting('onCellMouseOver')) {
      table = that.instance.wtTable.TABLE;
      td = (0, _element.closestDown)(event.realTarget, ['TD', 'TH'], table);
      mainWOT = that.instance.cloneSource || that.instance;

      if (td && td !== mainWOT.lastMouseOver && (0, _element.isChildOf)(td, table)) {
        mainWOT.lastMouseOver = td;

        that.instance.getSetting('onCellMouseOver', event, that.instance.wtTable.getCoords(td), td, that.instance);
      }
    }
  };

  var onMouseOut = function onMouseOut(event) {
    var table = void 0;
    var lastTD = void 0;
    var nextTD = void 0;

    if (that.instance.hasSetting('onCellMouseOut')) {
      table = that.instance.wtTable.TABLE;
      lastTD = (0, _element.closestDown)(event.realTarget, ['TD', 'TH'], table);
      nextTD = (0, _element.closestDown)(event.relatedTarget, ['TD', 'TH'], table);

      if (lastTD && lastTD !== nextTD && (0, _element.isChildOf)(lastTD, table)) {
        that.instance.getSetting('onCellMouseOut', event, that.instance.wtTable.getCoords(lastTD), lastTD, that.instance);
      }
    }
  };

  var onMouseUp = function onMouseUp(event) {
    if (event.button !== 2) {
      // if not right mouse button
      var cell = that.parentCell(event.realTarget);

      if (cell.TD === dblClickOrigin[0] && cell.TD === dblClickOrigin[1]) {
        if ((0, _element.hasClass)(event.realTarget, 'corner')) {
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
        that.dblClickTimeout[1] = setTimeout(function () {
          dblClickOrigin[1] = null;
        }, 500);
      } else if (cell.TD && that.instance.hasSetting('onCellMouseUp')) {
        that.instance.getSetting('onCellMouseUp', event, cell.coords, cell.TD, that.instance);
      }
    }
  };

  var selectedCellWasTouched = function selectedCellWasTouched(touchTarget) {
    var cellUnderFinger = that.parentCell(touchTarget);
    var coordsOfCellUnderFinger = cellUnderFinger.coords;

    if (selectedCellBeforeTouchEnd && coordsOfCellUnderFinger) {
      var _ref = [coordsOfCellUnderFinger.row, selectedCellBeforeTouchEnd.from.row],
          rowTouched = _ref[0],
          rowSelected = _ref[1];
      var _ref2 = [coordsOfCellUnderFinger.col, selectedCellBeforeTouchEnd.from.col],
          colTouched = _ref2[0],
          colSelected = _ref2[1];


      return rowTouched === rowSelected && colTouched === colSelected;
    }

    return false;
  };

  var onTouchEnd = function onTouchEnd(event) {
    var excludeTags = ['A', 'BUTTON', 'INPUT'];
    var target = event.target;

    // touched link which was placed inside a cell (a cell with DOM `a` element) WILL NOT trigger the below function calls
    // and as consequence will behave as standard (open the link).
    if (selectedCellWasTouched(target) === false || excludeTags.includes(target.tagName) === false) {
      event.preventDefault();
      onMouseUp(event);
    }
  };

  eventManager.addEventListener(this.instance.wtTable.holder, 'mousedown', onMouseDown);
  eventManager.addEventListener(this.instance.wtTable.holder, 'contextmenu', onContextMenu);
  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseover', onMouseOver);
  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseout', onMouseOut);
  eventManager.addEventListener(this.instance.wtTable.holder, 'mouseup', onMouseUp);

  // check if full HOT instance, or detached WOT AND run on mobile device
  if (this.instance.wtTable.holder.parentNode.parentNode && (0, _browser.isMobileBrowser)() && !that.instance.wtTable.isWorkingOnClone()) {
    var classSelector = '.' + this.instance.wtTable.holder.parentNode.className.split(' ').join('.');

    eventManager.addEventListener(this.instance.wtTable.holder, 'touchstart', function (event) {
      selectedCellBeforeTouchEnd = instance.selections.getCell().cellRange;

      that.instance.touchApplied = true;
      if ((0, _element.isChildOf)(event.target, classSelector)) {
        onTouchStart.call(event.target, event);
      }
    });
    eventManager.addEventListener(this.instance.wtTable.holder, 'touchend', function (event) {
      that.instance.touchApplied = false;
      if ((0, _element.isChildOf)(event.target, classSelector)) {
        onTouchEnd.call(event.target, event);
      }
    });

    if (!that.instance.momentumScrolling) {
      that.instance.momentumScrolling = {};
    }
    eventManager.addEventListener(this.instance.wtTable.holder, 'scroll', function () {
      clearTimeout(that.instance.momentumScrolling._timeout);

      if (!that.instance.momentumScrolling.ongoing) {
        that.instance.getSetting('onBeforeTouchScroll');
      }
      that.instance.momentumScrolling.ongoing = true;

      that.instance.momentumScrolling._timeout = setTimeout(function () {
        if (!that.instance.touchApplied) {
          that.instance.momentumScrolling.ongoing = false;

          that.instance.getSetting('onAfterMomentumScroll');
        }
      }, 200);
    });
  }

  eventManager.addEventListener(window, 'resize', function () {
    if (that.instance.getSetting('stretchH') !== 'none') {
      that.instance.draw();
    }
  });

  this.destroy = function () {
    clearTimeout(this.dblClickTimeout[0]);
    clearTimeout(this.dblClickTimeout[1]);

    eventManager.destroy();
  };
}

Event.prototype.parentCell = function (elem) {
  var cell = {};
  var TABLE = this.instance.wtTable.TABLE;
  var TD = (0, _element.closestDown)(elem, ['TD', 'TH'], TABLE);

  if (TD) {
    cell.coords = this.instance.wtTable.getCoords(TD);
    cell.TD = TD;
  } else if ((0, _element.hasClass)(elem, 'wtBorder') && (0, _element.hasClass)(elem, 'current')) {
    cell.coords = this.instance.selections.getCell().cellRange.highlight;
    cell.TD = this.instance.wtTable.getCell(cell.coords);
  } else if ((0, _element.hasClass)(elem, 'wtBorder') && (0, _element.hasClass)(elem, 'area')) {
    if (this.instance.selections.createOrGetArea().cellRange) {
      cell.coords = this.instance.selections.createOrGetArea().cellRange.to;
      cell.TD = this.instance.wtTable.getCell(cell.coords);
    }
  }

  return cell;
};

exports.default = Event;