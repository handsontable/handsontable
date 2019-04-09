/**
 * @class ColumnFilter
 */
class ColumnFilter {
  /**
   * @param {Number} offset
   * @param {Number} total
   * @param {Number} countTH
   */
  constructor(offset, total, countTH) {
    this.offset = offset;
    this.total = total;
    this.countTH = countTH;
  }

  /**
   * @param index
   * @returns {Number}
   */
  offsetted(index) {
    return index + this.offset;
  }

  /**
   * @param index
   * @returns {Number}
   */
  unOffsetted(index) {
    return index - this.offset;
  }

  /**
   * @param index
   * @returns {Number}
   */
  renderedToSource(index) {
    return this.offsetted(index);
  }

  /**
   * @param index
   * @returns {Number}
   */
  sourceToRendered(index) {
    return this.unOffsetted(index);
  }

  /**
   * @param index
   * @returns {Number}
   */
  offsettedTH(index) {
    return index - this.countTH;
  }

  /**
   * @param index
   * @returns {Number}
   */
  unOffsettedTH(index) {
    return index + this.countTH;
  }

  /**
   * @param index
   * @returns {Number}
   */
  visibleRowHeadedColumnToSourceColumn(index) {
    return this.renderedToSource(this.offsettedTH(index));
  }

  /**
   * @param index
   * @returns {Number}
   */
  sourceColumnToVisibleRowHeadedColumn(index) {
    return this.unOffsettedTH(this.sourceToRendered(index));
  }
}

export default ColumnFilter;
