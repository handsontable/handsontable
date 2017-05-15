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
}

export default Collection;
