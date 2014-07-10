/**
 * WalkontableColumnFilter
 * @constructor
 */
function WalkontableColumnFilter(offset, total, fixedCount, countTH) {
  this.offset = offset;
  this.total = total;
  this.fixedCount = fixedCount;
  this.countTH = countTH;
}

WalkontableColumnFilter.prototype = new WalkontableAbstractFilter();

WalkontableColumnFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableColumnFilter.prototype.unOffsettedTH = function (n) {
  return n + this.countTH;
};

WalkontableColumnFilter.prototype.visibleRowHeadedColumnToSourceColumn = function (n) {
  return this.visibleToSource(this.offsettedTH(n));
};

WalkontableColumnFilter.prototype.sourceColumnToVisibleRowHeadedColumn = function (n) {
  return this.unOffsettedTH(this.sourceToVisible(n));
};