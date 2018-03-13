import {isRightClick, isLeftClick} from './../helpers/dom/event';
import {CellCoords} from './../3rdparty/walkontable/src';

export function mouseDown(event, coords, selection, instance, controller) {
  const actualSelection = instance.getSelectedRangeLast();
  const selectedCorner = selection.isSelectedByCorner();
  const selectedRow = selection.isSelectedByRowHeader();
  const selectedColumn = selection.isSelectedByColumnHeader();

  if (event.shiftKey && actualSelection) {
    if (coords.row >= 0 && coords.col >= 0 && !controller.cells) {
      selection.setRangeEnd(coords);

    } else if ((selectedCorner || selectedRow) && coords.row >= 0 && coords.col >= 0 && !controller.cells) {
      selection.setRangeEnd(new CellCoords(coords.row, coords.col));

    } else if (selectedCorner && coords.row < 0 && !controller.column) {
      selection.setRangeEnd(new CellCoords(actualSelection.to.row, coords.col));

    } else if (selectedRow && coords.col < 0 && !controller.row) {
      selection.setRangeEnd(new CellCoords(coords.row, actualSelection.to.col));

    } else if (((!selectedCorner && !selectedRow && coords.col < 0) ||
               (selectedCorner && coords.col < 0)) && !controller.row) {
      selection.selectRows(actualSelection.from.row, coords.row);

    } else if (((!selectedCorner && !selectedRow && coords.row < 0) ||
               (selectedRow && coords.row < 0)) && !controller.column) {
      selection.selectColumns(actualSelection.from.col, coords.col);
    }
  } else {
    let doNewSelection = true;

    if (actualSelection) {
      let {from, to} = actualSelection;
      let coordsNotInSelection = !selection.inInSelection(coords);

      if (coords.row < 0 && selectedCorner) {
        let start = Math.min(from.col, to.col);
        let end = Math.max(from.col, to.col);

        doNewSelection = (coords.col < start || coords.col > end);

      } else if (coords.col < 0 && selectedRow) {
        let start = Math.min(from.row, to.row);
        let end = Math.max(from.row, to.row);

        doNewSelection = (coords.row < start || coords.row > end);

      } else {
        doNewSelection = coordsNotInSelection;
      }
    }

    const rightClick = isRightClick(event);
    const leftClick = isLeftClick(event) || event.type === 'touchstart';

    // clicked row header and when some column was selected
    if (coords.row < 0 && coords.col >= 0 && !controller.column) {
      if (leftClick || (rightClick && doNewSelection)) {
        selection.selectColumns(coords.col, coords.col, {keepPreviousSelection: true});
      }

    // clicked column header and when some row was selected
    } else if (coords.col < 0 && coords.row >= 0 && !controller.row) {
      if (leftClick || (rightClick && doNewSelection)) {
        selection.selectRows(coords.row, coords.row, {keepPreviousSelection: true});
      }

    } else if (coords.col >= 0 && coords.row >= 0 && !controller.cells) {
      if (leftClick || (rightClick && doNewSelection)) {
        selection.setRangeStart(coords);
      }
    } else if (coords.col < 0 && coords.row < 0) {
      selection.setRangeStart(coords);
    }
  }
}

export function mouseOver(event, coords, selection, instance, controller) {
  if (!isLeftClick(event)) {
    return;
  }

  const selectedRow = selection.isSelectedByRowHeader();
  const selectedColumn = selection.isSelectedByColumnHeader();

  if (coords.row >= 0 && coords.col >= 0) { // is not a header
    if (selectedColumn && !controller.column) {
      selection.setRangeEnd(new CellCoords(instance.countRows() - 1, coords.col));

    } else if (selectedRow && !controller.row) {
      selection.setRangeEnd(new CellCoords(coords.row, instance.countCols() - 1));

    } else if (!controller.cell) {
      selection.setRangeEnd(coords);
    }
  } else {
    /* eslint-disable no-lonely-if */
    if (selectedColumn && !controller.column) {
      selection.setRangeEnd(new CellCoords(instance.countRows() - 1, coords.col));

    } else if (selectedRow && !controller.row) {
      selection.setRangeEnd(new CellCoords(coords.row, instance.countCols() - 1));

    } else if (!controller.cell) {
      selection.setRangeEnd(coords);
    }
  }
}

const handlers = new Map([
  ['mousedown', mouseDown],
  ['mouseover', mouseOver],
]);

export function handleMouseEvent(event, {coords, selection, instance, controller}) {
  handlers.get(event.type)(event, coords, selection, instance, controller);
}
