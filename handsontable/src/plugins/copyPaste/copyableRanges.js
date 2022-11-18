import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';

/**
 * The utils class produces the selection ranges in the `{startRow, startCol, endRow, endCol}` format
 * based on the current table selection. The CopyPaste plugin consumes that ranges to generate
 * appropriate data ready to copy to the clipboard.
 *
 * @private
 */
export class CopyableRangesFactory {
  /**
   * @type {CellRange}
   */
  #selectedRange;
  /**
   * @type {function(): number}
   */
  #countRows;
  /**
   * @type {function(): number}
   */
  #countColumns;
  /**
   * @type {function(): number}
   */
  #countColumnHeaders;

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * @param {{
   *   countRows: function(): number,
   *   countColumns: function(): number,
   *   countColumnHeaders: function(): number
   * }} dependencies The utils class dependencies.
   */
  constructor({ countRows, countColumns, countColumnHeaders }) {
    this.#countRows = countRows;
    this.#countColumns = countColumns;
    this.#countColumnHeaders = countColumnHeaders;
  }
  /* eslint-enable jsdoc/require-description-complete-sentence */

  /**
   * Sets the selection range to be processed.
   *
   * @param {CellRange} selectedRange The selection range represented by the CellRange class.
   */
  setSelectedRange(selectedRange) {
    this.#selectedRange = selectedRange;
  }

  /**
   * Returns a new coords object within the dataset range (cells) with `startRow`, `startCol`, `endRow`
   * and `endCol` keys.
   *
   * @returns {{startRow: number, startCol: number, endRow: number, endCol: number} | null}
   */
  getCellsRange() {
    if (this.#countRows() === 0 || this.#countColumns() === 0) {
      return null;
    }

    const {
      row: startRow,
      col: startCol,
    } = this.#selectedRange.getTopStartCorner();
    const {
      row: endRow,
      col: endCol,
    } = this.#selectedRange.getBottomEndCorner();

    return {
      startRow,
      startCol,
      endRow,
      endCol,
    };
  }

  /**
   * Returns a new coords object within the most-bottom column headers range with `startRow`,
   * `startCol`, `endRow` and `endCol` keys.
   *
   * @returns {{startRow: number, startCol: number, endRow: number, endCol: number} | null}
   */
  getMostBottomColumnHeadersRange() {
    if (this.#countColumns() === 0 || this.#countColumnHeaders() === 0) {
      return null;
    }

    const {
      col: startCol,
    } = this.#selectedRange.getTopStartCorner();
    const {
      col: endCol,
    } = this.#selectedRange.getBottomEndCorner();

    return {
      startRow: -1,
      startCol,
      endRow: -1,
      endCol,
    };
  }

  /**
   * Returns a new coords object within all column headers layers (including nested headers) range with
   * `startRow`, `startCol`, `endRow` and `endCol` keys.
   *
   * @returns {{startRow: number, startCol: number, endRow: number, endCol: number} | null}
   */
  getAllColumnHeadersRange() {
    if (this.#countColumns() === 0 || this.#countColumnHeaders() === 0) {
      return null;
    }

    const {
      col: startCol,
    } = this.#selectedRange.getTopStartCorner();
    const {
      col: endCol,
    } = this.#selectedRange.getBottomEndCorner();

    return {
      startRow: -this.#countColumnHeaders(),
      startCol,
      endRow: -1,
      endCol,
    };
  }
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
