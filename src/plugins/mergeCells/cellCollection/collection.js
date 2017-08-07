/**
 * The `Collection` class represents a single merged cells collection.
 *
 * @class Collection
 * @plugin MergeCells
 */
class Collection {
  constructor(row, column, rowspan, colspan) {
    /**
     * The index of the topmost collection row.
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
     * The `rowspan` value of the collection.
     *
     * @type {Number}
     */
    this.rowspan = rowspan;
    /**
     * The `colspan` value of the collection.
     *
     * @type {Number}
     */
    this.colspan = colspan;
    /**
     * `true` only if the collection is bound to be removed.
     *
     * @type {Boolean}
     */
    this.removed = false;
  }

  /**
   * Sanitize (prevent from going outside the boundaries) the collection.
   *
   * @private
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
   * Returns `true` if the provided coordinates are inside the collection.
   *
   * @param {Number} row The row index.
   * @param {Number} column The column index.
   * @return {Boolean}
   */
  includes(row, column) {
    return this.row <= row && this.col <= column && this.row + this.rowspan - 1 >= row && this.col + this.colspan - 1 >= column;
  }

  /**
   * Returns `true` if the provided `column` property is within the column span of the collection.
   *
   * @param {Number} column The column index.
   * @return {Boolean}
   */
  includesHorizontally(column) {
    return this.col <= column && this.col + this.colspan - 1 >= column;
  }

  /**
   * Returns `true` if the provided `row` property is within the row span of the collection.
   *
   * @param {Number} row Row index.
   * @return {Boolean}
   */
  includesVertically(row) {
    return this.row <= row && this.row + this.rowspan - 1 >= row;
  }

  /**
   * Shift (and possibly resize, if needed) the merged collection.
   *
   * @private
   * @param {Array} shiftVector 2-element array containing the information on the shifting in the `x` and `y` axis.
   * @param {Number} indexOfChange Index of the preceding change.
   * @returns {boolean} Returns `false` if the whole collection was removed.
   */
  shift(shiftVector, indexOfChange) {
    const shiftValue = shiftVector[0] || shiftVector[1];
    const shiftedIndex = indexOfChange + Math.abs(shiftVector[0] || shiftVector[1]) - 1;
    const SPAN = shiftVector[0] ? 'colspan' : 'rowspan';
    const INDEX = shiftVector[0] ? 'col' : 'row';
    const changeStart = Math.min(indexOfChange, shiftedIndex);
    const changeEnd = Math.max(indexOfChange, shiftedIndex);
    const mergeStart = this[INDEX];
    const mergeEnd = this[INDEX] + this[SPAN] - 1;

    if (mergeStart >= indexOfChange) {
      this[INDEX] += shiftValue;
    }

    // adding rows/columns
    if (shiftValue > 0) {

      if (indexOfChange <= mergeEnd && indexOfChange > mergeStart) {
        this[SPAN] += shiftValue;
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

        this[INDEX] -= preRemovedOffset;
        this[SPAN] -= removedOffset;

        // removing the middle part of the merge
      } else if (mergeStart <= changeStart && mergeEnd >= changeEnd) {
        this[SPAN] += shiftValue;

        // removing the end part of the merge
      } else if (mergeStart <= changeStart && mergeEnd >= changeStart && mergeEnd < changeEnd) {
        const removedPart = mergeEnd - changeStart + 1;

        this[SPAN] -= removedPart;
      }
    }

    return true;
  }

  /**
   * Check if the second provided collection is "farther" in the provided direction.
   *
   * @private
   * @param {Collection} collection The collection to check.
   * @param {String} direction Drag direction.
   * @return {boolean} `true` if the second provided collection is "farther".
   * @param collection
   */
  isFarther(collection, direction) {
    if (!collection) {
      return true;
    }

    if (direction === 'down') {
      return collection.row + collection.rowspan - 1 < this.row + this.rowspan - 1;

    } else if (direction === 'up') {
      return collection.row > this.row;

    } else if (direction === 'right') {
      return collection.col + collection.colspan - 1 < this.col + this.colspan - 1;

    } else if (direction === 'left') {
      return collection.col > this.col;
    }
  }
}

export default Collection;
