import { clamp } from '../../helpers/number';
import { getMostTopStartPosition, getMostBottomEndPosition } from '../../helpers/mixed';

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
