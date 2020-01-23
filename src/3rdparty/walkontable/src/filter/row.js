/**
 * @class RowFilter
 */
class RowFilter {
  /**
   * @param {number} offset The scroll vertical offset.
   * @param {number} total The total height of the table.
   * @param {number} countTH The number of rendered column headers.
   */
  constructor(offset, total, countTH) {
    this.offset = offset;
    this.total = total;
    this.countTH = countTH;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  offsetted(index) {
    return index + this.offset;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  unOffsetted(index) {
    return index - this.offset;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  renderedToSource(index) {
    return this.offsetted(index);
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  sourceToRendered(index) {
    return this.unOffsetted(index);
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  offsettedTH(index) {
    return index - this.countTH;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  unOffsettedTH(index) {
    return index + this.countTH;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  visibleColHeadedRowToSourceRow(index) {
    return this.renderedToSource(this.offsettedTH(index));
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  sourceRowToVisibleColHeadedRow(index) {
    return this.unOffsettedTH(this.sourceToRendered(index));
  }
}

export default RowFilter;
