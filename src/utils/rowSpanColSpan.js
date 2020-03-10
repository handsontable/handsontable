import { CellRange } from '../3rdparty/walkontable/src';

const assumedDefaultSpan = 1;

/**
 * Expand coords to range including the rowSpan and colSpan information from the cell meta data.
 * Used to determine the visible boundary of a cell that might be the beginning of a merged cell.
 *
 * @param {Core} hotInstance Handsontable instance.
 * @param {CellCoords} coords Coords of a cell that might be a beginning of a merged cell.
 * @returns {CellRange}
 */
export default function expandCoordsToRangeIncludingSpans(hotInstance, coords) {
  const range = new CellRange(coords);
  const cellMeta = hotInstance.getCellMeta(coords.row, coords.col);
  if (cellMeta.rowspan) {
    range.to.row = range.to.row + cellMeta.rowspan - assumedDefaultSpan;
  }
  if (cellMeta.colspan) {
    range.to.col = range.to.col + cellMeta.colspan - assumedDefaultSpan;
  }
  return range;
}
