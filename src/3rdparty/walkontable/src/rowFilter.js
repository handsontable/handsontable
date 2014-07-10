/**
 * WalkontableRowFilter
 * @constructor
 */
function WalkontableRowFilter(offset, total, fixedCount, countTH) {
  this.offset = offset;
  this.total = total;
  this.fixedCount = fixedCount;
  this.countTH = countTH;
}

WalkontableRowFilter.prototype = new WalkontableAbstractFilter();

WalkontableRowFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableRowFilter.prototype.visibleColHeadedColumnToSourceColumn = function (n) {
  return this.visibleToSource(this.offsettedTH(n));
};

WalkontableRowFilter.prototype.sourceColumnToVisibleColHeadedColumn = function (n) {
  return this.unOffsettedTH(this.sourceToVisible(n));
};
