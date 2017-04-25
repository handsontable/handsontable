/**
 * TODO: docs
 */
class Collection {
  constructor(row, column, rowspan, colspan) {
    this.row = row;
    //TODO: rename col to column?
    this.col = column;
    this.rowspan = rowspan;
    this.colspan = colspan;
  }

  /**
   * TODO: docs, tests
   */
  inludes(row, column) {
    return this.row <= row && this.col <= column && this.row + this. rowspan - 1 >= row && this.col + this.colspan - 1 >= column;
  }

  /**
   * TODO: docs, tests
   * @param column
   */
  includesHorizontally(column) {
    return this.col <= column && this.col + this.colspan - 1 >= column;
  }

  /**
   * TODO: docs, tests
   * @param row
   */
  includesVertically(row) {
    return this.row <= row && this.row + this. rowspan - 1 >= row;
  }
}

export default Collection;