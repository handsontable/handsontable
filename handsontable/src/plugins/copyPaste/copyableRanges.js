import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';

/**
 * Returns a new coords object within the dataset range (cells) with `startRow`, `startCol`, `endRow`
 * and `endCol` keys.
 *
 * @param {CellRange} selectionRange The selection range represented by the CellRange class.
 * @returns {{startRow: number, startCol: number, endRow: number, endCol: number} | null}
 */
export function getCellsRange(selectionRange) {
  const {
    row: startRow,
    col: startCol,
  } = selectionRange.getTopStartCorner();
  const {
    row: endRow,
    col: endCol,
  } = selectionRange.getBottomEndCorner();

  if (selectionRange.getHeight() === 0 || selectionRange.getWidth() === 0) {
    return null;
  }

  return {
    startRow,
    startCol,
    endRow,
    endCol,
  };
}

/**
 * Returns a new coords object within the column headers range with `startRow`, `startCol`, `endRow`
 * and `endCol` keys.
 *
 * @param {CellRange} selectionRange The selection range represented by the CellRange class.
 * @returns {{startRow: number, startCol: number, endRow: number, endCol: number} | null}
 */
export function getColumnHeadersRange(selectionRange) {
  if (selectionRange.getWidth() === 0) {
    return null;
  }

  const {
    col: startCol,
  } = selectionRange.getTopStartCorner();
  const {
    col: endCol,
  } = selectionRange.getBottomEndCorner();

  return {
    startRow: -1,
    startCol,
    endRow: -1,
    endCol,
  };
}

/**
 * Returns a new coords object within the column group headers (nested headers) range with `startRow`,
 * `startCol`, `endRow` and `endCol` keys.
 *
 * @param {CellRange} selectionRange The selection range represented by the CellRange class.
 * @param {number} columnHeadersCount The total count of the column header layers.
 * @returns {{startRow: number, startCol: number, endRow: number, endCol: number} | null}
 */
export function getColumnGroupHeadersRange(selectionRange, columnHeadersCount) {
  if (columnHeadersCount === 0 || selectionRange.getWidth() === 0) {
    return null;
  }

  const {
    col: startCol,
  } = selectionRange.getTopStartCorner();
  const {
    col: endCol,
  } = selectionRange.getBottomEndCorner();

  return {
    startRow: -columnHeadersCount,
    startCol,
    endRow: -1,
    endCol,
  };
}

/**
 * Returns an object with `rows` and `columns` keys. The arrays contains sorted indexes
 * generated according to the given `ranges` array.
 *
 * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} ranges The range to process.
 * @returns {{rows: number[], columns: number[]}}
 */
export function normalizeRanges(ranges) {
  const rows = [];
  const columns = [];

  arrayEach(ranges, (range) => {
    const minRow = Math.min(range.startRow, range.endRow);
    const maxRow = Math.max(range.startRow, range.endRow);

    rangeEach(minRow, maxRow, (row) => {
      if (rows.indexOf(row) === -1) {
        rows.push(row);
      }
    });

    const minColumn = Math.min(range.startCol, range.endCol);
    const maxColumn = Math.max(range.startCol, range.endCol);

    rangeEach(minColumn, maxColumn, (column) => {
      if (columns.indexOf(column) === -1) {
        columns.push(column);
      }
    });
  });

  return {
    rows,
    columns,
  };
}
