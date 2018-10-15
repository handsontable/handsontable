'use strict';

exports.__esModule = true;
exports.mouseDown = mouseDown;
exports.mouseOver = mouseOver;
exports.handleMouseEvent = handleMouseEvent;

var _event = require('./../helpers/dom/event');

var _src = require('./../3rdparty/walkontable/src');

/**
 * MouseDown handler.
 *
 * @param {Object} options
 * @param {Boolean} options.isShiftKey The flag which indicates if the shift key is pressed.
 * @param {Boolean} options.isLeftClick The flag which indicates if the left mouse button is pressed.
 * @param {Boolean} options.isRightClick The flag which indicates if the right mouse button is pressed.
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {Object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 */
function mouseDown(_ref) {
  var isShiftKey = _ref.isShiftKey,
      isLeftClick = _ref.isLeftClick,
      isRightClick = _ref.isRightClick,
      coords = _ref.coords,
      selection = _ref.selection,
      controller = _ref.controller;

  var currentSelection = selection.isSelected() ? selection.getSelectedRange().current() : null;
  var selectedCorner = selection.isSelectedByCorner();
  var selectedRow = selection.isSelectedByRowHeader();

  if (isShiftKey && currentSelection) {
    if (coords.row >= 0 && coords.col >= 0 && !controller.cells) {
      selection.setRangeEnd(coords);
    } else if ((selectedCorner || selectedRow) && coords.row >= 0 && coords.col >= 0 && !controller.cells) {
      selection.setRangeEnd(new _src.CellCoords(coords.row, coords.col));
    } else if (selectedCorner && coords.row < 0 && !controller.column) {
      selection.setRangeEnd(new _src.CellCoords(currentSelection.to.row, coords.col));
    } else if (selectedRow && coords.col < 0 && !controller.row) {
      selection.setRangeEnd(new _src.CellCoords(coords.row, currentSelection.to.col));
    } else if ((!selectedCorner && !selectedRow && coords.col < 0 || selectedCorner && coords.col < 0) && !controller.row) {
      selection.selectRows(currentSelection.from.row, coords.row);
    } else if ((!selectedCorner && !selectedRow && coords.row < 0 || selectedRow && coords.row < 0) && !controller.column) {
      selection.selectColumns(currentSelection.from.col, coords.col);
    }
  } else {
    var newCoord = new _src.CellCoords(coords.row, coords.col);

    if (newCoord.row < 0) {
      newCoord.row = 0;
    }
    if (newCoord.col < 0) {
      newCoord.col = 0;
    }

    var allowRightClickSelection = !selection.inInSelection(newCoord);
    var performSelection = isLeftClick || isRightClick && allowRightClickSelection;

    // clicked row header and when some column was selected
    if (coords.row < 0 && coords.col >= 0 && !controller.column) {
      if (performSelection) {
        selection.selectColumns(coords.col);
      }

      // clicked column header and when some row was selected
    } else if (coords.col < 0 && coords.row >= 0 && !controller.row) {
      if (performSelection) {
        selection.selectRows(coords.row);
      }
    } else if (coords.col >= 0 && coords.row >= 0 && !controller.cells) {
      if (performSelection) {
        selection.setRangeStart(coords);
      }
    } else if (coords.col < 0 && coords.row < 0) {
      selection.setRangeStart(coords);
    }
  }
}

/**
 * MouseOver handler.
 *
 * @param {Object} options
 * @param {Boolean} options.isLeftClick
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {Object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 */
function mouseOver(_ref2) {
  var isLeftClick = _ref2.isLeftClick,
      coords = _ref2.coords,
      selection = _ref2.selection,
      controller = _ref2.controller;

  if (!isLeftClick) {
    return;
  }

  var selectedRow = selection.isSelectedByRowHeader();
  var selectedColumn = selection.isSelectedByColumnHeader();
  var countCols = selection.tableProps.countCols();
  var countRows = selection.tableProps.countRows();

  if (selectedColumn && !controller.column) {
    selection.setRangeEnd(new _src.CellCoords(countRows - 1, coords.col));
  } else if (selectedRow && !controller.row) {
    selection.setRangeEnd(new _src.CellCoords(coords.row, countCols - 1));
  } else if (!controller.cell) {
    selection.setRangeEnd(coords);
  }
}

var handlers = new Map([['mousedown', mouseDown], ['mouseover', mouseOver], ['touchstart', mouseDown]]);

/**
 * Mouse handler for selection functionality.
 *
 * @param {Event} event An native event to handle.
 * @param {Object} options
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {Object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 */
function handleMouseEvent(event, _ref3) {
  var coords = _ref3.coords,
      selection = _ref3.selection,
      controller = _ref3.controller;

  handlers.get(event.type)({
    coords: coords,
    selection: selection,
    controller: controller,
    isShiftKey: event.shiftKey,
    isLeftClick: (0, _event.isLeftClick)(event) || event.type === 'touchstart',
    isRightClick: (0, _event.isRightClick)(event)
  });
}