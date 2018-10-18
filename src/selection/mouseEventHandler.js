import { isRightClick as isRightClickEvent, isLeftClick as isLeftClickEvent } from './../helpers/dom/event';
import { CellCoords } from './../3rdparty/walkontable/src';

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
export function mouseDown({ isShiftKey, isLeftClick, isRightClick, coords, selection, controller }) {
  const currentSelection = selection.isSelected() ? selection.getSelectedRange().current() : null;
  const selectedCorner = selection.isSelectedByCorner();
  const selectedRow = selection.isSelectedByRowHeader();

  if (isShiftKey && currentSelection) {
    if (coords.row >= 0 && coords.col >= 0 && !controller.cells) {
      selection.setRangeEnd(coords);

    } else if ((selectedCorner || selectedRow) && coords.row >= 0 && coords.col >= 0 && !controller.cells) {
      selection.setRangeEnd(new CellCoords(coords.row, coords.col));

    } else if (selectedCorner && coords.row < 0 && !controller.column) {
      selection.setRangeEnd(new CellCoords(currentSelection.to.row, coords.col));

    } else if (selectedRow && coords.col < 0 && !controller.row) {
      selection.setRangeEnd(new CellCoords(coords.row, currentSelection.to.col));

    } else if (((!selectedCorner && !selectedRow && coords.col < 0) ||
               (selectedCorner && coords.col < 0)) && !controller.row) {
      selection.selectRows(currentSelection.from.row, coords.row);

    } else if (((!selectedCorner && !selectedRow && coords.row < 0) ||
               (selectedRow && coords.row < 0)) && !controller.column) {
      selection.selectColumns(currentSelection.from.col, coords.col);
    }
  } else {
    const newCoord = new CellCoords(coords.row, coords.col);

    if (newCoord.row < 0) {
      newCoord.row = 0;
    }
    if (newCoord.col < 0) {
      newCoord.col = 0;
    }

    const allowRightClickSelection = !selection.inInSelection(newCoord);
    const performSelection = isLeftClick || (isRightClick && allowRightClickSelection);

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
export function mouseOver({ isLeftClick, coords, selection, controller }) {
  if (!isLeftClick) {
    return;
  }

  const selectedRow = selection.isSelectedByRowHeader();
  const selectedColumn = selection.isSelectedByColumnHeader();
  const countCols = selection.tableProps.countCols();
  const countRows = selection.tableProps.countRows();

  if (selectedColumn && !controller.column) {
    selection.setRangeEnd(new CellCoords(countRows - 1, coords.col));

  } else if (selectedRow && !controller.row) {
    selection.setRangeEnd(new CellCoords(coords.row, countCols - 1));

  } else if (!controller.cell) {
    selection.setRangeEnd(coords);
  }
}

const handlers = new Map([
  ['mousedown', mouseDown],
  ['mouseover', mouseOver],
  ['touchstart', mouseDown],
]);

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
export function handleMouseEvent(event, { coords, selection, controller }) {
  handlers.get(event.type)({
    coords,
    selection,
    controller,
    isShiftKey: event.shiftKey,
    isLeftClick: isLeftClickEvent(event) || event.type === 'touchstart',
    isRightClick: isRightClickEvent(event),
  });
}
