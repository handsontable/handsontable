/**
 * @class ColumnFilter
 */
class ColumnFilter {
  /**
   * @type {number}
   */
  offset;
  /**
   * @type {number}
   */
  total;
  /**
   * @type {number}
   */
  countTH;

  /**
   * @param {number} offset The scroll horizontal offset.
   * @param {number} total The total width of the table.
   * @param {number} countTH The number of rendered row headers.
   */
  constructor(offset, total, countTH) {
    this.offset = offset;
    this.total = total;
    this.countTH = countTH;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  offsetted(index) {
    return index + this.offset;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  unOffsetted(index) {
    return index - this.offset;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  renderedToSource(index) {
    return this.offsetted(index);
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  sourceToRendered(index) {
    return this.unOffsetted(index);
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  offsettedTH(index) {
    return index - this.countTH;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  unOffsettedTH(index) {
    return index + this.countTH;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  visibleRowHeadedColumnToSourceColumn(index) {
    return this.renderedToSource(this.offsettedTH(index));
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  sourceColumnToVisibleRowHeadedColumn(index) {
    return this.unOffsettedTH(this.sourceToRendered(index));
  }
}

export default ColumnFilter;
