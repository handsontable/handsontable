import { isRightClick as isRightClickEvent, isLeftClick as isLeftClickEvent } from './../helpers/dom/event';

/**
 * MouseDown handler.
 *
 * @param {object} options The handler options.
 * @param {boolean} options.isShiftKey The flag which indicates if the shift key is pressed.
 * @param {boolean} options.isLeftClick The flag which indicates if the left mouse button is pressed.
 * @param {boolean} options.isRightClick The flag which indicates if the right mouse button is pressed.
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 * @param {Function} options.cellCoordsFactory The function factory for CellCoords objects.
 */
export function mouseDown({ isShiftKey, isLeftClick, isRightClick, coords, selection, controller, cellCoordsFactory }) {
  const currentSelection = selection.isSelected() ? selection.getSelectedRange().current() : null;
  const selectedCorner = selection.isSelectedByCorner();
  const selectedRow = selection.isSelectedByRowHeader();

  selection.markSource('mouse');

  if (isShiftKey && currentSelection) {
    if (coords.row >= 0 && coords.col >= 0 && !controller.cell) {
      selection.setRangeEnd(coords);

    } else if ((selectedCorner || selectedRow) && coords.row >= 0 && coords.col >= 0 && !controller.cell) {
      selection.setRangeEnd(cellCoordsFactory(coords.row, coords.col));

    } else if (selectedCorner && coords.row < 0 && !controller.column) {
      selection.setRangeEnd(cellCoordsFactory(currentSelection.to.row, coords.col));

    } else if (selectedRow && coords.col < 0 && !controller.row) {
      selection.setRangeEnd(cellCoordsFactory(coords.row, currentSelection.to.col));

    } else if (((!selectedCorner && !selectedRow && coords.col < 0) ||
               (selectedCorner && coords.col < 0)) && !controller.row) {
      selection.selectRows(Math.max(currentSelection.from.row, 0), coords.row, coords.col);

    } else if (((!selectedCorner && !selectedRow && coords.row < 0) ||
               (selectedRow && coords.row < 0)) && !controller.column) {
      selection.selectColumns(Math.max(currentSelection.from.col, 0), coords.col, coords.row);
    }

  } else {
    const allowRightClickSelection = !selection.inInSelection(coords);
    const performSelection = isLeftClick || (isRightClick && allowRightClickSelection);

    // clicked row header and when some column was selected
    if (coords.row < 0 && coords.col >= 0 && !controller.column) {
      if (performSelection) {
        selection.selectColumns(coords.col, coords.col, coords.row);
      }

    // clicked column header and when some row was selected
    } else if (coords.col < 0 && coords.row >= 0 && !controller.row) {
      if (performSelection) {
        selection.selectRows(coords.row, coords.row, coords.col);
      }

    } else if (coords.col >= 0 && coords.row >= 0 && !controller.cell) {
      if (performSelection) {
        selection.setRangeStart(coords);
      }
    } else if (coords.col < 0 && coords.row < 0) {
      selection.selectAll(true, true, {
        disableHeadersHighlight: true,
        focusPosition: { row: 0, col: 0 },
      });
    }
  }

  selection.markEndSource();
}

/**
 * MouseOver handler.
 *
 * @param {object} options The handler options.
 * @param {boolean} options.isLeftClick Indicates that event was fired using the left mouse button.
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 * @param {Function} options.cellCoordsFactory The function factory for CellCoords objects.
 */
export function mouseOver({ isLeftClick, coords, selection, controller, cellCoordsFactory }) {
  if (!isLeftClick) {
    return;
  }

  const selectedRow = selection.isSelectedByRowHeader();
  const selectedColumn = selection.isSelectedByColumnHeader();
  const countCols = selection.tableProps.countCols();
  const countRows = selection.tableProps.countRows();

  selection.markSource('mouse');

  if (selectedColumn && !controller.column) {
    selection.setRangeEnd(cellCoordsFactory(countRows - 1, coords.col));

  } else if (selectedRow && !controller.row) {
    selection.setRangeEnd(cellCoordsFactory(coords.row, countCols - 1));

  } else if (!controller.cell) {
    selection.setRangeEnd(coords);
  }

  selection.markEndSource();
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
 * @param {object} options The handler options.
 * @param {CellRange} options.coords The CellCoords object with defined visual coordinates.
 * @param {Selection} options.selection The Selection class instance.
 * @param {object} options.controller An object with keys `row`, `column`, `cell` which indicate what
 *                                    operation will be performed in later selection stages.
 * @param {Function} options.cellCoordsFactory The function factory for CellCoords objects.
 */
export function handleMouseEvent(event, { coords, selection, controller, cellCoordsFactory }) {
  handlers.get(event.type)({
    coords,
    selection,
    controller,
    cellCoordsFactory,
    isShiftKey: event.shiftKey,
    isLeftClick: isLeftClickEvent(event) || event.type === 'touchstart',
    isRightClick: isRightClickEvent(event),
  });
}
