import type CellCoords from '../../3rdparty/walkontable/src/cell/coords';

/**
 * Get direction between positions and cords of selections difference (drag area).
 *
 * @param {Array} startSelection The coordinates where the selection starts.
 * @param {Array} endSelection The coordinates where the selection ends.
 * @param {Function} cellCoordsFactory The function factory for CellCoords objects.
 * @returns {{direction: string, start: CellCoords, end: CellCoords}}
 */
export function getDragDirectionAndRange(
  startSelection: number[], endSelection: number[],
  cellCoordsFactory: (row: number, col: number) => CellCoords
) {
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
 * The axis a fill-handle drag extends the selection along.
 */
export type DragDirection = 'vertical' | 'horizontal';

/**
 * Counts how many indexes an index lies outside an inclusive range, on either side of it.
 *
 * @param {number} index The index to measure.
 * @param {number} start The first index of the range.
 * @param {number} end The last index of the range.
 * @returns {number} `0` for an index inside the range, otherwise its distance to the nearest edge.
 */
export function getDistanceOutsideRange(index: number, start: number, end: number): number {
  if (index < start) {
    return start - index;
  }

  if (index > end) {
    return index - end;
  }

  return 0;
}

/**
 * Resolves the axis a fill-handle drag extends the selection along, from how far the cell under
 * the pointer lies outside the selection on each axis.
 *
 * The fill handle sits on the selection's corner, so a pointer moving diagonally leaves the
 * selection on both axes at once. The direction is then taken from the axis the pointer is
 * further outside on, and a tie resolves as vertical. An axis the allowed directions leave out is
 * ignored, so it can neither win nor block the other one. Once resolved, the direction is kept
 * until the pointer comes back inside the selection along its axis.
 *
 * @param {DragDirection|null} currentDirection The direction resolved for the drag so far.
 * @param {number} rowDistance How many rows the pointer's cell lies outside the selection.
 * @param {number} columnDistance How many columns the pointer's cell lies outside the selection.
 * @param {string[]} allowedDirections The directions the `fillHandle` option allows.
 * @returns {DragDirection|null} `null` while no direction applies.
 */
export function resolveDragDirection(
  currentDirection: DragDirection | null,
  rowDistance: number,
  columnDistance: number,
  allowedDirections: readonly string[],
): DragDirection | null {
  if (rowDistance === 0 && columnDistance === 0) {
    return null;
  }

  const canFillVertically = allowedDirections.includes('vertical');
  const canFillHorizontally = allowedDirections.includes('horizontal');

  if (currentDirection === 'vertical' && rowDistance === 0) {
    return canFillHorizontally ? 'horizontal' : currentDirection;
  }

  if (currentDirection === 'horizontal' && columnDistance === 0) {
    return canFillVertically ? 'vertical' : currentDirection;
  }

  if (currentDirection !== null) {
    return currentDirection;
  }

  const verticalDistance = canFillVertically ? rowDistance : 0;
  const horizontalDistance = canFillHorizontally ? columnDistance : 0;

  if (verticalDistance > 0 && verticalDistance >= horizontalDistance) {
    return 'vertical';
  }

  if (horizontalDistance > 0) {
    return 'horizontal';
  }

  return null;
}

/**
 * Counts how many cells a pointer reached past one of the table's edges, a cell it only entered
 * included. Used to weigh a pointer outside the table, where the cell under it is clamped to the
 * table's edge and the distance in cells would read 0.
 *
 * @param {number} pixelsPastEdge How far past the edge the pointer is, in pixels (not positive when
 * the pointer is on or inside the edge).
 * @param {number} cellSize The size of the edge's row or column, in pixels.
 * @returns {number}
 */
export function countCellsPastEdge(pixelsPastEdge: number, cellSize: number): number {
  if (pixelsPastEdge <= 0) {
    return 0;
  }

  if (!(cellSize > 0)) {
    return 1;
  }

  return Math.ceil(pixelsPastEdge / cellSize);
}

/**
 * The cell reads a copy-down needs, by visual row and column.
 */
export interface CopyDownCellReaders {
  /**
   * Tells whether a cell of a selected column is empty, so the fill may write into it.
   */
  isFilledColumnEmpty(row: number, column: number): boolean;
  /**
   * Tells whether a cell of a neighboring column is empty. It must answer `true` for a column outside
   * the grid (the neighbor of the first or last column).
   */
  isGuideColumnEmpty(row: number, column: number): boolean;
  /**
   * Tells whether a row is hidden. A hidden row never ends the fill.
   */
  isRowHidden(row: number): boolean;
}

/**
 * Finds the last row a copy-down (a double-click on the fill handle) fills below a selection, the
 * way spreadsheet applications do (DEV-859).
 *
 * The fill follows one guide column: the nearest visible column to the left of the selection, or the
 * nearest visible one to its right when the left one is empty in the first visible row below the
 * selection. The caller resolves those two columns (a column hidden with `HiddenColumns` keeps its
 * visual index, so the plain neighbors can be columns the user cannot see). Walking down from
 * the row below the selection, the fill stops above the first row where any selected column already
 * holds a value, so nothing is overwritten, and at the first visible row where the guide column is
 * empty. A hidden row never ends the fill, but a value in it still stops the fill above it.
 *
 * @param {CopyDownCellReaders} readers The cell reads.
 * @param {object} selection The selection's last row and its first and last column, as visual indexes,
 * and optionally the guide column candidates on each side (`startGuideColumn`, `endGuideColumn`), which
 * default to the plain neighbors.
 * @param {number} rowCount The number of rows in the grid.
 * @returns {number|null} The visual index of the last row to fill, or `null` when there is nothing to fill.
 */
export function getCopyDownEndRow(
  readers: CopyDownCellReaders,
  selection: {
    endRow: number;
    startColumn: number;
    endColumn: number;
    startGuideColumn?: number;
    endGuideColumn?: number;
  },
  rowCount: number,
): number | null {
  const {
    endRow,
    startColumn,
    endColumn,
    startGuideColumn = startColumn - 1,
    endGuideColumn = endColumn + 1,
  } = selection;
  const { isFilledColumnEmpty, isGuideColumnEmpty, isRowHidden } = readers;
  let guideColumn: number | null = null;
  let lastRow: number | null = null;

  for (let row = endRow + 1; row < rowCount; row++) {
    for (let column = startColumn; column <= endColumn; column++) {
      if (!isFilledColumnEmpty(row, column)) {
        return lastRow;
      }
    }

    if (isRowHidden(row)) {
      continue;
    }

    if (guideColumn === null) {
      guideColumn = isGuideColumnEmpty(row, startGuideColumn) ? endGuideColumn : startGuideColumn;
    }

    if (isGuideColumnEmpty(row, guideColumn)) {
      return lastRow;
    }

    lastRow = row;
  }

  return lastRow;
}
