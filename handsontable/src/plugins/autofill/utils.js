import { clamp } from '../../helpers/number';

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
 * Finds which column the mouse is over within a given column range.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @param {number} row Row to use for measuring cell widths.
 * @param {number} startColumn First column in the range.
 * @param {number} endColumn Last column in the range (inclusive).
 * @param {number} relativeX Mouse X position relative to the first cell's edge.
 * @returns {number | null} Column index, or null if mouse is outside the range.
 */
function findColumnAtX(hotInstance, row, startColumn, endColumn, relativeX) {
  let accumulatedX = 0;

  for (let column = startColumn; column <= endColumn; column++) {
    const cellElement = hotInstance.getCell(row, column, true);

    if (!cellElement) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const width = cellElement.offsetWidth;

    if (relativeX < accumulatedX + width) {
      return column;
    }

    accumulatedX += width;

    const { colspan } = hotInstance.getCellMeta(row, column);

    if (colspan > 1) {
      column += colspan - 1;
    }
  }

  return null;
}

/**
 * Finds which row the mouse is over within a given row range.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @param {number} column Column to use for measuring cell heights.
 * @param {number} startRow First row in the range.
 * @param {number} endRow Last row in the range (inclusive).
 * @param {number} relativeY Mouse Y position relative to the first cell's edge.
 * @returns {number | null} Row index, or null if mouse is outside the range.
 */
function findRowAtY(hotInstance, column, startRow, endRow, relativeY) {
  let accumulatedY = 0;

  for (let row = startRow; row <= endRow; row++) {
    const cellElement = hotInstance.getCell(row, column, true);

    if (!cellElement) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const height = cellElement.offsetHeight;

    if (relativeY < accumulatedY + height) {
      return row;
    }

    accumulatedY += height;

    const { rowspan } = hotInstance.getCellMeta(row, column);

    if (rowspan > 1) {
      row += rowspan - 1;
    }
  }

  return null;
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
  const {
    view,
    columnIndexMapper,
    rowIndexMapper,
  } = hotInstance;
  const isRtl = hotInstance.isRtl();
  const numberOfFixedColumnsStart = view.countNotHiddenFixedColumnsStart();
  const numberOfFixedRowsTop = view.countNotHiddenFixedRowsTop();
  const numberOfFixedRowsBottom = view.countNotHiddenFixedRowsBottom();

  const firstPartiallyVisibleRow = hotInstance.getFirstPartiallyVisibleRow();
  const lastPartiallyVisibleRow = hotInstance.getLastPartiallyVisibleRow();
  const firstPartiallyVisibleColumn = hotInstance.getFirstPartiallyVisibleColumn();
  const lastPartiallyVisibleColumn = hotInstance.getLastPartiallyVisibleColumn();
  const tableOffset = hotInstance.rootElement.getBoundingClientRect();

  const tableViewportLeft = tableOffset.left;
  const tableViewportTop = tableOffset.top;
  const columnHeaderHeight = hotInstance.hasColHeaders() ? view.getColumnHeaderHeight() : 0;
  const rowHeaderWidth = hotInstance.hasRowHeaders() ? view.getRowHeaderWidth() : 0;
  const tableViewportRight = tableViewportLeft + view.getViewportWidth() + rowHeaderWidth;
  const tableViewportBottom = tableViewportTop + view.getViewportHeight() + columnHeaderHeight;

  const clampedX = clamp(mouseX, tableViewportLeft, tableViewportRight);
  const clampedY = clamp(mouseY, tableViewportTop, tableViewportBottom);

  let foundColumn = null;

  // Check fixed columns first
  if (numberOfFixedColumnsStart > 0) {
    const firstFixedColumn = columnIndexMapper.getVisualFromRenderableIndex(0);
    const firstNonHiddenColumn = columnIndexMapper.getNearestNotHiddenIndex(firstFixedColumn, 1);
    const fixedCell = hotInstance.getCell(firstPartiallyVisibleRow, firstNonHiddenColumn, true);
    const fixedCellRect = fixedCell.getBoundingClientRect();
    const fixedRelativeX = isRtl ? fixedCellRect.right - clampedX : clampedX - fixedCellRect.left;

    foundColumn = findColumnAtX(
      hotInstance,
      firstPartiallyVisibleRow,
      firstNonHiddenColumn,
      columnIndexMapper.getVisualFromRenderableIndex(numberOfFixedColumnsStart - 1),
      fixedRelativeX,
    );
  }

  // If not in fixed columns, check scrollable columns (main table)
  if (foundColumn === null) {
    const scrollCell = hotInstance.getCell(firstPartiallyVisibleRow, firstPartiallyVisibleColumn, true);
    const scrollCellRect = scrollCell.getBoundingClientRect();
    const scrollRelativeX = isRtl ? scrollCellRect.right - clampedX : clampedX - scrollCellRect.left;

    foundColumn = findColumnAtX(
      hotInstance,
      firstPartiallyVisibleRow,
      firstPartiallyVisibleColumn,
      lastPartiallyVisibleColumn,
      scrollRelativeX,
    );

    // Fallback to edge columns if still not found
    if (foundColumn === null) {
      foundColumn = scrollRelativeX < 0 ? firstPartiallyVisibleColumn : lastPartiallyVisibleColumn;
    }
  }

  let foundRow = null;

  // Check fixed top rows first
  if (numberOfFixedRowsTop > 0) {
    const firstFixedRow = rowIndexMapper.getVisualFromRenderableIndex(0);
    const firstNonHiddenRow = rowIndexMapper.getNearestNotHiddenIndex(firstFixedRow, 1);
    const fixedCell = hotInstance.getCell(firstNonHiddenRow, firstPartiallyVisibleColumn, true);
    const fixedCellRect = fixedCell.getBoundingClientRect();
    const fixedRelativeY = clampedY - fixedCellRect.top;

    foundRow = findRowAtY(
      hotInstance,
      firstPartiallyVisibleColumn,
      firstNonHiddenRow,
      rowIndexMapper.getVisualFromRenderableIndex(numberOfFixedRowsTop - 1),
      fixedRelativeY,
    );
  }

  // Check fixed bottom rows if not found in fixed top rows
  if (foundRow === null && numberOfFixedRowsBottom > 0) {
    const totalSourceRows = rowIndexMapper.getNotHiddenIndexesLength();
    const bottomStartRow = rowIndexMapper.getVisualFromRenderableIndex(totalSourceRows - numberOfFixedRowsBottom);
    const bottomEndRow = rowIndexMapper.getVisualFromRenderableIndex(totalSourceRows - 1);
    const bottomStartNonHiddenRow = rowIndexMapper.getNearestNotHiddenIndex(bottomStartRow, 1);
    const bottomEndNonHiddenRow = rowIndexMapper.getNearestNotHiddenIndex(bottomEndRow, -1);
    const fixedBottomCell = hotInstance.getCell(bottomStartNonHiddenRow, firstPartiallyVisibleColumn, true);
    const fixedBottomCellRect = fixedBottomCell.getBoundingClientRect();
    const fixedBottomRelativeY = clampedY - fixedBottomCellRect.top;

    if (fixedBottomRelativeY >= 0) {
      foundRow = findRowAtY(
        hotInstance,
        firstPartiallyVisibleColumn,
        bottomStartNonHiddenRow,
        bottomEndNonHiddenRow,
        fixedBottomRelativeY
      );

      if (foundRow === null) {
        foundRow = bottomEndNonHiddenRow;
      }
    }
  }

  // Check scrollable rows (main table)
  if (foundRow === null) {
    const scrollCell = hotInstance.getCell(firstPartiallyVisibleRow, firstPartiallyVisibleColumn, true);
    const scrollCellRect = scrollCell.getBoundingClientRect();
    const scrollRelativeY = clampedY - scrollCellRect.top;

    foundRow = findRowAtY(
      hotInstance,
      firstPartiallyVisibleColumn,
      firstPartiallyVisibleRow,
      lastPartiallyVisibleRow,
      scrollRelativeY,
    );

    // Fallback to edge rows if still not found
    if (foundRow === null) {
      foundRow = lastPartiallyVisibleRow;
    }
  }

  return hotInstance._createCellCoords(foundRow, foundColumn);
}
