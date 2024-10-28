import { toSingleLine } from '../../helpers/templateLiteralTag';

/**
 * The `MergedCellCoords` class represents a single merged cell.
 *
 * @private
 * @class MergedCellCoords
 */
class MergedCellCoords {
  /**
   * The index of the topmost merged cell row.
   *
   * @type {number}
   */
  row;
  /**
   * The index of the leftmost column.
   *
   * @type {number}
   */
  col;
  /**
   * The `rowspan` value of the merged cell.
   *
   * @type {number}
   */
  rowspan;
  /**
   * The `colspan` value of the merged cell.
   *
   * @type {number}
   */
  colspan;
  /**
   * `true` only if the merged cell is bound to be removed.
   *
   * @type {boolean}
   */
  removed = false;
  /**
   * The CellCoords function factory.
   *
   * @type {Function}
   */
  cellCoordsFactory;
  /**
   * The CellRange function factory.
   *
   * @type {Function}
   */
  cellRangeFactory;
  /**
   * The cached range coordinates of the merged cell.
   *
   * @type {CellRange}
   */
  #cellRange = null;

  constructor(row, column, rowspan, colspan, cellCoordsFactory, cellRangeFactory) {
    this.row = row;
    this.col = column;
    this.rowspan = rowspan;
    this.colspan = colspan;
    this.cellCoordsFactory = cellCoordsFactory;
    this.cellRangeFactory = cellRangeFactory;
  }

  /**
   * Get a warning message for when the declared merged cell data contains negative values.
   *
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCell Object containing information
   * about the merged cells that was about to be added.
   * @returns {string}
   */
  static NEGATIVE_VALUES_WARNING({ row, col, rowspan, colspan }) {
    return toSingleLine`The merged cell declared with {row: ${row}, col: ${col},\x20
      rowspan: ${rowspan}, colspan: ${colspan}} contains negative values, which is\x20
      not supported. It will not be added to the collection.`;
  }

  /**
   * Get a warning message for when the declared merged cell data contains values exceeding the table limits.
   *
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCell Object containing information
   * about the merged cells that was about to be added.
   * @returns {string}
   */
  static IS_OUT_OF_BOUNDS_WARNING({ row, col }) {
    return toSingleLine`The merged cell declared at [${row}, ${col}] is positioned\x20
      (or positioned partially) outside of the table range. It was not added to the table, please fix your setup.`;
  }

  /**
   * Get a warning message for when the declared merged cell data represents a single cell.
   *
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCell Object containing information
   * about the merged cells that was about to be added.
   * @returns {string}
   */
  static IS_SINGLE_CELL({ row, col }) {
    return toSingleLine`The merged cell declared at [${row}, ${col}] has both "rowspan"\x20
      and "colspan" declared as "1", which makes it a single cell. It cannot be added to the collection.`;
  }

  /**
   * Get a warning message for when the declared merged cell data contains "colspan" or "rowspan", that equals 0.
   *
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCell Object containing information
   * about the merged cells that was about to be added.
   * @returns {string}
   */
  static ZERO_SPAN_WARNING({ row, col }) {
    return toSingleLine`The merged cell declared at [${row}, ${col}] has "rowspan"\x20
      or "colspan" declared as "0", which is not supported. It cannot be added to the collection.`;
  }

  /**
   * Check whether the values provided for a merged cell contain any negative values.
   *
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCell Object containing information
   * about the merged cells that was about to be added.
   * @returns {boolean}
   */
  static containsNegativeValues({ row, col, rowspan, colspan }) {
    return row < 0 || col < 0 || rowspan < 0 || colspan < 0;
  }

  /**
   * Check whether the provided merged cell information object represents a single cell.
   *
   * @private
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCell Object containing information
   * about the merged cells that was about to be added.
   * @returns {boolean}
   */
  static isSingleCell({ rowspan, colspan }) {
    return colspan === 1 && rowspan === 1;
  }

  /**
   * Check whether the provided merged cell information object contains a rowspan or colspan of 0.
   *
   * @private
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCell Object containing information
   * about the merged cells that was about to be added.
   * @returns {boolean}
   */
  static containsZeroSpan({ rowspan, colspan }) {
    return colspan === 0 || rowspan === 0;
  }

  /**
   * Check whether the provided merged cell object is to be declared out of bounds of the table.
   *
   * @param {object} mergeCell Object containing the `row`, `col`, `rowspan` and `colspan` properties.
   * @param {number} rowCount Number of rows in the table.
   * @param {number} columnCount Number of rows in the table.
   * @returns {boolean}
   */
  static isOutOfBounds(mergeCell, rowCount, columnCount) {
    return mergeCell.row < 0 ||
      mergeCell.col < 0 ||
      mergeCell.row >= rowCount ||
      mergeCell.row + mergeCell.rowspan - 1 >= rowCount ||
      mergeCell.col >= columnCount ||
      mergeCell.col + mergeCell.colspan - 1 >= columnCount;
  }

  /**
   * Sanitize (prevent from going outside the boundaries) the merged cell.
   *
   * @param {Core} hotInstance The Handsontable instance.
   */
  normalize(hotInstance) {
    const totalRows = hotInstance.countRows();
    const totalColumns = hotInstance.countCols();

    if (this.row < 0) {
      this.row = 0;

    } else if (this.row > totalRows - 1) {
      this.row = totalRows - 1;
    }

    if (this.col < 0) {
      this.col = 0;

    } else if (this.col > totalColumns - 1) {
      this.col = totalColumns - 1;
    }

    if (this.row + this.rowspan > totalRows - 1) {
      this.rowspan = totalRows - this.row;
    }

    if (this.col + this.colspan > totalColumns - 1) {
      this.colspan = totalColumns - this.col;
    }

    this.#cellRange = null;
  }

  /**
   * Returns `true` if the provided coordinates are inside the merged cell.
   *
   * @param {number} row The row index.
   * @param {number} column The column index.
   * @returns {boolean}
   */
  includes(row, column) {
    return this.row <= row && this.col <= column &&
      this.row + this.rowspan - 1 >= row && this.col + this.colspan - 1 >= column;
  }

  /**
   * Returns `true` if the provided `column` property is within the column span of the merged cell.
   *
   * @param {number} column The column index.
   * @returns {boolean}
   */
  includesHorizontally(column) {
    return this.col <= column && this.col + this.colspan - 1 >= column;
  }

  /**
   * Returns `true` if the provided `row` property is within the row span of the merged cell.
   *
   * @param {number} row Row index.
   * @returns {boolean}
   */
  includesVertically(row) {
    return this.row <= row && this.row + this.rowspan - 1 >= row;
  }

  /**
   * Shift (and possibly resize, if needed) the merged cell.
   *
   * @param {Array} shiftVector 2-element array containing the information on the shifting in the `x` and `y` axis.
   * @param {number} indexOfChange Index of the preceding change.
   * @returns {boolean} Returns `false` if the whole merged cell was removed.
   */
  shift(shiftVector, indexOfChange) {
    const shiftValue = shiftVector[0] || shiftVector[1];
    const shiftedIndex = indexOfChange + Math.abs(shiftVector[0] || shiftVector[1]) - 1;
    const span = shiftVector[0] ? 'colspan' : 'rowspan';
    const index = shiftVector[0] ? 'col' : 'row';
    const changeStart = Math.min(indexOfChange, shiftedIndex);
    const changeEnd = Math.max(indexOfChange, shiftedIndex);
    const mergeStart = this[index];
    const mergeEnd = this[index] + this[span] - 1;

    if (mergeStart >= indexOfChange) {
      this[index] += shiftValue;
    }

    // adding rows/columns
    if (shiftValue > 0) {
      if (indexOfChange <= mergeEnd && indexOfChange > mergeStart) {
        this[span] += shiftValue;
      }

      // removing rows/columns
    } else if (shiftValue < 0) {

      // removing the whole merge
      if (changeStart <= mergeStart && changeEnd >= mergeEnd) {
        this.removed = true;
        this.#cellRange = null;

        return false;

        // removing the merge partially, including the beginning
      } else if (mergeStart >= changeStart && mergeStart <= changeEnd) {
        const removedOffset = changeEnd - mergeStart + 1;
        const preRemovedOffset = Math.abs(shiftValue) - removedOffset;

        this[index] -= preRemovedOffset + shiftValue;
        this[span] -= removedOffset;

        // removing the middle part of the merge
      } else if (mergeStart <= changeStart && mergeEnd >= changeEnd) {
        this[span] += shiftValue;

        // removing the end part of the merge
      } else if (mergeStart <= changeStart && mergeEnd >= changeStart && mergeEnd < changeEnd) {
        const removedPart = mergeEnd - changeStart + 1;

        this[span] -= removedPart;
      }
    }

    this.#cellRange = null;

    return true;
  }

  /**
   * Check if the second provided merged cell is "farther" in the provided direction.
   *
   * @param {MergedCellCoords} mergedCell The merged cell to check.
   * @param {string} direction Drag direction.
   * @returns {boolean|null} `true` if the second provided merged cell is "farther".
   */
  isFarther(mergedCell, direction) {
    if (!mergedCell) {
      return true;
    }

    if (direction === 'down') {
      return mergedCell.row + mergedCell.rowspan - 1 < this.row + this.rowspan - 1;

    } else if (direction === 'up') {
      return mergedCell.row > this.row;

    } else if (direction === 'right') {
      return mergedCell.col + mergedCell.colspan - 1 < this.col + this.colspan - 1;

    } else if (direction === 'left') {
      return mergedCell.col > this.col;
    }

    return null;
  }

  /**
   * Get the bottom row index of the merged cell.
   *
   * @returns {number}
   */
  getLastRow() {
    return this.row + this.rowspan - 1;
  }

  /**
   * Get the rightmost column index of the merged cell.
   *
   * @returns {number}
   */
  getLastColumn() {
    return this.col + this.colspan - 1;
  }

  /**
   * Get the range coordinates of the merged cell.
   *
   * @returns {CellRange}
   */
  getRange() {
    if (!this.#cellRange) {
      this.#cellRange = this.cellRangeFactory(
        this.cellCoordsFactory(this.row, this.col),
        this.cellCoordsFactory(this.row, this.col),
        this.cellCoordsFactory(this.getLastRow(), this.getLastColumn()),
      );
    }

    return this.#cellRange;
  }
}

export default MergedCellCoords;
