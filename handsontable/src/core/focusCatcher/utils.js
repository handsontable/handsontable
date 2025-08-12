import { clamp } from '../../helpers/number';
import { getMostBottomEndPosition } from '../../helpers/mixed';

/**
 * Normalizes the coordinates (clamps to nearest visible cell position within dataset range).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {function(Coords | undefined): Coords | null}
 */
export function normalizeCoordsIfNeeded(hot) {
  return (coords) => {
    if (!coords) {
      return null;
    }

    const { rowIndexMapper, columnIndexMapper } = hot;

    if (rowIndexMapper.isHidden(coords.row) || columnIndexMapper.isHidden(coords.col)) {
      return null;
    }

    const mostTopStartCoords = getMostTopStartPosition(hot);
    const mostBottomEndCoords = getMostBottomEndPosition(hot);

    coords.row = clamp(coords.row, mostTopStartCoords.row, mostBottomEndCoords.row);
    coords.col = clamp(coords.col, mostTopStartCoords.col, mostBottomEndCoords.col);

    return coords;
  };
}

/**
 * Gets the coordinates of the most top-start cell or header (depends on the table settings and its size).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {CellCoords|null}
 */
export function getMostTopStartPosition(hot) {
  const { rowIndexMapper, columnIndexMapper } = hot;
  const { navigableHeaders } = hot.getSettings();
  let topRow = navigableHeaders && hot.countColHeaders() > 0 ? -hot.countColHeaders() : 0;
  let startColumn = navigableHeaders && hot.countRowHeaders() > 0 ? -hot.countRowHeaders() : 0;

  if (topRow === 0) {
    topRow = rowIndexMapper.getVisualFromRenderableIndex(topRow);
  }

  if (startColumn === 0) {
    startColumn = columnIndexMapper.getVisualFromRenderableIndex(startColumn);
  }

  if (topRow === null || startColumn === null) {
    return null;
  }

  return hot._createCellCoords(topRow, startColumn);
}
