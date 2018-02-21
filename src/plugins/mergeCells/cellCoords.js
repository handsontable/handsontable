import {CellCoords, CellRange} from '../../3rdparty/walkontable/src/index';

/**
 * The `MergedCellCoords` class represents a single merged cell.
 *
 * @class MergedCellCoords
 * @plugin MergeCells
 */
class MergedCellCoords {
  constructor(row, column, rowspan, colspan) {
    /**
     * The index of the topmost merged cell row.
     *
     * @type {Number}
     */
    this.row = row;
    /**
     * The index of the leftmost column.
     *
     * @type {Number}
     */
    this.col = column;
    /**
     * The `rowspan` value of the merged cell.
     *
     * @type {Number}
     */
    this.rowspan = rowspan;
    /**
     * The `colspan` value of the merged cell.
     *
     * @type {Number}
     */
    this.colspan = colspan;
    /**
     * `true` only if the merged cell is bound to be removed.
     *
     * @type {Boolean}
     */
    this.removed = false;
  }

  /**
   * Sanitize (prevent from going outside the boundaries) the merged cell.
   *
   * @param hotInstance
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
  }

  /**
   * Returns `true` if the provided coordinates are inside the merged cell.
   *
   * @param {Number} row The row index.
   * @param {Number} column The column index.
   * @return {Boolean}
   */
  includes(row, column) {
    return this.row <= row && this.col <= column && this.row + this.rowspan - 1 >= row && this.col + this.colspan - 1 >= column;
  }

  /**
   * Returns `true` if the provided `column` property is within the column span of the merged cell.
   *
   * @param {Number} column The column index.
   * @return {Boolean}
   */
  includesHorizontally(column) {
    return this.col <= column && this.col + this.colspan - 1 >= column;
  }

  /**
   * Returns `true` if the provided `row` property is within the row span of the merged cell.
   *
   * @param {Number} row Row index.
   * @return {Boolean}
   */
  includesVertically(row) {
    return this.row <= row && this.row + this.rowspan - 1 >= row;
  }

  /**
   * Shift (and possibly resize, if needed) the merged cell.
   *
   * @param {Array} shiftVector 2-element array containing the information on the shifting in the `x` and `y` axis.
   * @param {Number} indexOfChange Index of the preceding change.
   * @returns {Boolean} Returns `false` if the whole merged cell was removed.
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
        return false;

        // removing the merge partially, including the beginning
      } else if (mergeStart >= changeStart && mergeStart <= changeEnd) {
        const removedOffset = changeEnd - mergeStart + 1;
        const preRemovedOffset = Math.abs(shiftValue) - removedOffset;

        this[index] -= preRemovedOffset;
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

    return true;
  }

  /**
   * Check if the second provided merged cell is "farther" in the provided direction.
   *
   * @param {MergedCellCoords} mergedCell The merged cell to check.
   * @param {String} direction Drag direction.
   * @return {Boolean|null} `true` if the second provided merged cell is "farther".
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
   * @returns {Number}
   */
  getLastRow() {
    return this.row + this.rowspan - 1;
  }

  /**
   * Get the rightmost column index of the merged cell.
   *
   * @returns {Number}
   */
  getLastColumn() {
    return this.col + this.colspan - 1;
  }

  /**
   * Get the range coordinates of the merged cell.
   *
   * @return {CellRange}
   */
  getRange() {
    return new CellRange(new CellCoords(this.row, this.col), new CellCoords(this.row, this.col), new CellCoords(this.getLastRow(), this.getLastColumn()));
  }
}

export default MergedCellCoords;
