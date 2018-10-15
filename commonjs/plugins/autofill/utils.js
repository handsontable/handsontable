'use strict';

exports.__esModule = true;
exports.DIRECTIONS = undefined;
exports.getDeltas = getDeltas;
exports.getDragDirectionAndRange = getDragDirectionAndRange;
exports.getMappedFillHandleSetting = getMappedFillHandleSetting;

var _object = require('./../../helpers/object');

var _mixed = require('./../../helpers/mixed');

var _src = require('./../../3rdparty/walkontable/src');

var DIRECTIONS = exports.DIRECTIONS = {
  horizontal: 'horizontal',
  vertical: 'vertical'
};

/**
 * Get deltas array.
 *
 * @param {CellCoords} start
 * @param {CellCoords} end
 * @param {Array} data
 * @param {String} direction
 * @returns {Array}
 */
function getDeltas(start, end, data, direction) {
  var rowsLength = data.length;
  var columnsLength = data ? data[0].length : 0;
  var deltas = [];
  var diffRow = end.row - start.row;
  var diffCol = end.col - start.col;

  if (['down', 'up'].indexOf(direction) !== -1) {
    var arr = [];

    for (var col = 0; col <= diffCol; col++) {
      var startValue = parseInt(data[0][col], 10);
      var endValue = parseInt(data[rowsLength - 1][col], 10);
      var delta = (direction === 'down' ? endValue - startValue : startValue - endValue) / (rowsLength - 1) || 0;

      arr.push(delta);
    }

    deltas.push(arr);
  }

  if (['right', 'left'].indexOf(direction) !== -1) {
    for (var row = 0; row <= diffRow; row++) {
      var _startValue = parseInt(data[row][0], 10);
      var _endValue = parseInt(data[row][columnsLength - 1], 10);
      var _delta = (direction === 'right' ? _endValue - _startValue : _startValue - _endValue) / (columnsLength - 1) || 0;

      deltas.push([_delta]);
    }
  }

  return deltas;
}

/**
 * Get direction between positions and cords of selections difference (drag area)
 *
 * @param {Array} startSelection
 * @param {Array} endSelection
 * @returns {{direction: String, start: CellCoords, end: CellCoords}}
 */
function getDragDirectionAndRange(startSelection, endSelection) {
  var startOfDragCoords = void 0;
  var endOfDragCoords = void 0;
  var directionOfDrag = void 0;

  if (endSelection[0] === startSelection[0] && endSelection[1] < startSelection[1]) {
    directionOfDrag = 'left';

    startOfDragCoords = new _src.CellCoords(endSelection[0], endSelection[1]);
    endOfDragCoords = new _src.CellCoords(endSelection[2], startSelection[1] - 1);
  } else if (endSelection[2] === startSelection[2] && endSelection[0] === startSelection[0] && endSelection[3] > startSelection[3]) {
    directionOfDrag = 'right';

    startOfDragCoords = new _src.CellCoords(endSelection[0], startSelection[3] + 1);
    endOfDragCoords = new _src.CellCoords(endSelection[2], endSelection[3]);
  } else if (endSelection[0] < startSelection[0] && endSelection[1] === startSelection[1]) {
    directionOfDrag = 'up';

    startOfDragCoords = new _src.CellCoords(endSelection[0], endSelection[1]);
    endOfDragCoords = new _src.CellCoords(startSelection[0] - 1, endSelection[3]);
  } else if (endSelection[2] > startSelection[2] && endSelection[1] === startSelection[1]) {
    directionOfDrag = 'down';

    startOfDragCoords = new _src.CellCoords(startSelection[2] + 1, endSelection[1]);
    endOfDragCoords = new _src.CellCoords(endSelection[2], endSelection[3]);
  }

  return {
    directionOfDrag: directionOfDrag,
    startOfDragCoords: startOfDragCoords,
    endOfDragCoords: endOfDragCoords
  };
}

/**
 * Get mapped FillHandle setting containing information about
 * allowed FillHandle directions and if allowed is automatic insertion of rows on drag
 *
 * @param {Boolean|Object} fillHandle property of Handsontable settings
 * @returns {{directions: Array, autoInsertRow: Boolean}} object allowing access to information
 * about FillHandle in more useful way
 */
function getMappedFillHandleSetting(fillHandle) {
  var mappedSettings = {};

  if (fillHandle === true) {
    mappedSettings.directions = Object.keys(DIRECTIONS);
    mappedSettings.autoInsertRow = true;
  } else if ((0, _object.isObject)(fillHandle)) {
    if ((0, _mixed.isDefined)(fillHandle.autoInsertRow)) {

      // autoInsertRow for horizontal direction will be always false

      if (fillHandle.direction === DIRECTIONS.horizontal) {
        mappedSettings.autoInsertRow = false;
      } else {
        mappedSettings.autoInsertRow = fillHandle.autoInsertRow;
      }
    } else {
      mappedSettings.autoInsertRow = false;
    }

    if ((0, _mixed.isDefined)(fillHandle.direction)) {
      mappedSettings.directions = [fillHandle.direction];
    } else {
      mappedSettings.directions = Object.keys(DIRECTIONS);
    }
  } else if (typeof fillHandle === 'string') {
    mappedSettings.directions = [fillHandle];
    mappedSettings.autoInsertRow = true;
  } else {
    mappedSettings.directions = [];
    mappedSettings.autoInsertRow = false;
  }

  return mappedSettings;
}