import type { HotInstance } from '../../core/types';
import { clamp } from '../../helpers/number';

/**
 * Normalizes the coordinates (clamps to nearest visible cell position within dataset range).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {function(Coords | undefined): Coords | null}
 */
export function normalizeCoordsIfNeeded(hot: HotInstance) {
  return (coords: Record<string, number> | undefined) => {
    if (!coords) {
      return null;
    }

    const { rowIndexMapper, columnIndexMapper } = hot;

    if (rowIndexMapper.isHidden(coords.row) || columnIndexMapper.isHidden(coords.col)) {
      return null;
    }

    const mostTopStartCoords = getMostTopStartPosition(hot);
    const mostBottomEndCoords = getMostBottomEndPosition(hot);

    if (mostTopStartCoords === null || mostBottomEndCoords === null) {
      return null;
    }

    coords.row = clamp(coords.row, mostTopStartCoords.row ?? coords.row, mostBottomEndCoords.row ?? coords.row);
    coords.col = clamp(coords.col, mostTopStartCoords.col ?? coords.col, mostBottomEndCoords.col ?? coords.col);

    return coords;
  };
}

/**
 * Gets the coordinates of the most top-start cell or header (depends on the table settings and its size).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {CellCoords|null}
 */
export function getMostTopStartPosition(hot: HotInstance) {
  const { rowIndexMapper, columnIndexMapper } = hot;
  const { navigableHeaders } = hot.getSettings();
  const initialTopRow = navigableHeaders && hot.countColHeaders() > 0 ? -hot.countColHeaders() : 0;
  const initialStartColumn = navigableHeaders && hot.countRowHeaders() > 0 ? -hot.countRowHeaders() : 0;

  const topRow = initialTopRow === 0
    ? rowIndexMapper.getVisualFromRenderableIndex(initialTopRow)
    : initialTopRow;

  const startColumn = initialStartColumn === 0
    ? columnIndexMapper.getVisualFromRenderableIndex(initialStartColumn)
    : initialStartColumn;

  if (topRow === null || startColumn === null) {
    return null;
  }

  return hot._createCellCoords(topRow, startColumn);
}

/**
 * Gets the coordinates of the most bottom-end cell or header (depends on the table settings and its size).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {CellCoords|null}
 */
export function getMostBottomEndPosition(hot: HotInstance) {
  const { rowIndexMapper, columnIndexMapper } = hot;
  const { navigableHeaders } = hot.getSettings();
  let bottomRow = rowIndexMapper.getRenderableIndexesLength() - 1;
  let endColumn = columnIndexMapper.getRenderableIndexesLength() - 1;

  if (bottomRow < 0) {
    if (!navigableHeaders || hot.countColHeaders() === 0) {
      return null;
    }

    bottomRow = -1;
  }

  if (endColumn < 0) {
    if (!navigableHeaders || hot.countColHeaders() === 0) {
      return null;
    }

    endColumn = -1;
  }

  return hot._createCellCoords(
    rowIndexMapper.getVisualFromRenderableIndex(bottomRow) ?? bottomRow,
    columnIndexMapper.getVisualFromRenderableIndex(endColumn) ?? endColumn,
  );
}
