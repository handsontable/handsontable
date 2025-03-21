/**
 * @class ColumnFilter
 */
class ColumnFilter {
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
   * @param {number} offset The scroll horizontal offset.
   * @param {number} total The total width of the table.
   * @param {number} countTH The number of rendered row headers.
   */
  constructor(offset: number, total: number, countTH: number) {
    this.offset = offset;
    this.total = total;
    this.countTH = countTH;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  offsetted(index: number): number {
    return index + this.offset;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  unOffsetted(index: number): number {
    return index - this.offset;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  renderedToSource(index: number): number {
    return this.offsetted(index);
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  sourceToRendered(index: number): number {
    return this.unOffsetted(index);
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  offsettedTH(index: number): number {
    return index - this.countTH;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  unOffsettedTH(index: number): number {
    return index + this.countTH;
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  visibleRowHeadedColumnToSourceColumn(index: number): number {
    return this.renderedToSource(this.offsettedTH(index));
  }

  /**
   * @param {number} index The visual column index.
   * @returns {number}
   */
  sourceColumnToVisibleRowHeadedColumn(index: number): number {
    return this.unOffsettedTH(this.sourceToRendered(index));
  }
}

export default ColumnFilter;
