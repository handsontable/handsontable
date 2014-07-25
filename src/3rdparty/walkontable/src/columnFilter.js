/**
 * WalkontableColumnFilter
 * @constructor
 */
function WalkontableColumnFilter(total, countTH) {
  this.total = total;
  this.countTH = countTH;
}

WalkontableColumnFilter.prototype.visibleToSource = function (n) {
  return n;
};

WalkontableColumnFilter.prototype.sourceToVisible = function (n) {
  return n;
};

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