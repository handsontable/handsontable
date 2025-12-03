import { offset } from '../../helpers/dom/element';

/**
 * Get direction between positions and cords of selections difference (drag area).
 *
 * @param {Array} startSelection The coordinates where the selection starts.
 * @param {Array} endSelection The coordinates where the selection ends.
 * @param {Function} cellCoordsFactory The function factory for CellCoords objects.
 * @returns {{direction: string, start: CellCoords, end: CellCoords}}
 */
export function getDragDirectionAndRange(startSelection, endSelection, cellCoordsFactory) {
  let startOfDragCoords;
  let endOfDragCoords;
  let directionOfDrag;

  if (endSelection[0] === startSelection[0] && endSelection[1] < startSelection[1]) {
    directionOfDrag = 'left';

    startOfDragCoords = cellCoordsFactory(endSelection[0], endSelection[1]);
    endOfDragCoords = cellCoordsFactory(endSelection[2], startSelection[1] - 1);

  } else if (endSelection[2] === startSelection[2] && endSelection[0] === startSelection[0] &&
      endSelection[3] > startSelection[3]) {
    directionOfDrag = 'right';

    startOfDragCoords = cellCoordsFactory(endSelection[0], startSelection[3] + 1);
    endOfDragCoords = cellCoordsFactory(endSelection[2], endSelection[3]);

  } else if (endSelection[0] < startSelection[0] && endSelection[1] === startSelection[1]) {
    directionOfDrag = 'up';

    startOfDragCoords = cellCoordsFactory(endSelection[0], endSelection[1]);
    endOfDragCoords = cellCoordsFactory(startSelection[0] - 1, endSelection[3]);

  } else if (endSelection[2] > startSelection[2] &&
    endSelection[1] === startSelection[1]) {
    directionOfDrag = 'down';

    startOfDragCoords = cellCoordsFactory(startSelection[2] + 1, endSelection[1]);
    endOfDragCoords = cellCoordsFactory(endSelection[2], endSelection[3]);
  }

  if (startOfDragCoords) {
    startOfDragCoords.normalize();
  }

  if (endOfDragCoords) {
    endOfDragCoords.normalize();
  }

  return {
    directionOfDrag,
    startOfDragCoords,
    endOfDragCoords,
  };
}

/**
 * Get the cell coordinates from the mouse position. When the mouse is outside of the table,
 * the nearest cell is returned.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @param {number} mouseX The x coordinate of the mouse.
 * @param {number} mouseY The y coordinate of the mouse.
 * @returns {CellCoords} The cell coordinates.
 */
export function getCellCoordsFromMousePosition(hotInstance, mouseX, mouseY) {
  const { view, rootWindow } = hotInstance;
  const firstPartiallyVisibleRow = hotInstance.getFirstPartiallyVisibleRow();
  const lastPartiallyVisibleRow = hotInstance.getLastPartiallyVisibleRow();
  const firstPartiallyVisibleColumn = hotInstance.getFirstPartiallyVisibleColumn();
  const lastPartiallyVisibleColumn = hotInstance.getLastPartiallyVisibleColumn();
  const tableOffset = offset(hotInstance.table);
  const scrollX = view.isHorizontallyScrollableByWindow() ? rootWindow.scrollX : view.getTableScrollPosition().left;
  const scrollY = view.isVerticallyScrollableByWindow() ? rootWindow.scrollY : view.getTableScrollPosition().top;

  const tableViewportLeft = tableOffset.left - scrollX;
  const tableViewportTop = tableOffset.top - scrollY;
  const tableViewportRight = tableViewportLeft + view.getTableWidth();
  const tableViewportBottom = tableViewportTop + view.getTableHeight();

  // TODO: use clamp helper
  const clampedX = Math.max(tableViewportLeft, Math.min(tableViewportRight - 1, mouseX));
  const clampedY = Math.max(tableViewportTop, Math.min(tableViewportBottom - 1, mouseY));

  const firstCell = hotInstance.getCell(firstPartiallyVisibleRow, firstPartiallyVisibleColumn, true);
  const firstCellRect = firstCell.getBoundingClientRect();

  const relativeX = clampedX - firstCellRect.left;
  let foundColumn = firstPartiallyVisibleColumn;
  let accumulatedX = 0;

  for (let col = firstPartiallyVisibleColumn; col <= lastPartiallyVisibleColumn; col++) {
    const cellElement = hotInstance.getCell(firstPartiallyVisibleRow, col, true);

    if (!cellElement) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const width = cellElement.offsetWidth;

    if (relativeX >= accumulatedX && relativeX < accumulatedX + width) {
      foundColumn = col;
      break;
    }

    accumulatedX += width;
    foundColumn = col;

    if (relativeX < accumulatedX) {
      break;
    }

    const { colspan } = hotInstance.getCellMeta(firstPartiallyVisibleRow, col);

    if (colspan && colspan > 1) {
      col += colspan - 1;
    }
  }

  if (mouseX < tableViewportLeft) {
    foundColumn = firstPartiallyVisibleColumn;

  } else if (mouseX >= tableViewportRight) {
    foundColumn = lastPartiallyVisibleColumn;
  }

  const relativeY = clampedY - firstCellRect.top;
  let foundRow = firstPartiallyVisibleRow;
  let accumulatedY = 0;

  for (let row = firstPartiallyVisibleRow; row <= lastPartiallyVisibleRow; row++) {
    const cellElement = hotInstance.getCell(row, firstPartiallyVisibleColumn, true);

    if (!cellElement) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const height = cellElement.offsetHeight;

    if (relativeY >= accumulatedY && relativeY < accumulatedY + height) {
      foundRow = row;
      break;
    }

    accumulatedY += height;
    foundRow = row;

    if (relativeY < accumulatedY) {
      break;
    }

    const { rowspan } = hotInstance.getCellMeta(row, firstPartiallyVisibleColumn);

    if (rowspan && rowspan > 1) {
      row += rowspan - 1;
    }
  }

  if (mouseY < tableViewportTop) {
    foundRow = firstPartiallyVisibleRow;

  } else if (mouseY >= tableViewportBottom) {
    foundRow = lastPartiallyVisibleRow;
  }

  return hotInstance._createCellCoords(foundRow, foundColumn);
}
