/**
 * @class RowFilter
 */
class RowFilter {
  /**
   * @type {number}
   */
  offset: number;
  /**
   * @type {number}
   */
  total: number;
  /**
   * @type {number}
   */
  countTH: number;

  /**
   * @param {number} offset The scroll vertical offset.
   * @param {number} total The total height of the table.
   * @param {number} countTH The number of rendered column headers.
   */
  constructor(offset: number, total: number, countTH: number) {
    this.offset = offset;
    this.total = total;
    this.countTH = countTH;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  offsetted(index: number): number {
    return index + this.offset;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  unOffsetted(index: number): number {
    return index - this.offset;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  renderedToSource(index: number): number {
    return this.offsetted(index);
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  sourceToRendered(index: number): number {
    return this.unOffsetted(index);
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  offsettedTH(index: number): number {
    return index - this.countTH;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  unOffsettedTH(index: number): number {
    return index + this.countTH;
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  visibleColHeadedRowToSourceRow(index: number): number {
    return this.renderedToSource(this.offsettedTH(index));
  }

  /**
   * @param {number} index The visual row index.
   * @returns {number}
   */
  sourceRowToVisibleColHeadedRow(index: number): number {
    return this.unOffsettedTH(this.sourceToRendered(index));
  }
}

export default RowFilter;
