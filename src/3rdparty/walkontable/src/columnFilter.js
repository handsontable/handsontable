/**
 * WalkontableColumnFilter
 * @constructor
 */
function WalkontableColumnFilter(total, countTH) {
  this.total = total;
  this.countTH = countTH;
}

WalkontableColumnFilter.prototype.renderedToSource = function (n) {
  return n;
};

WalkontableColumnFilter.prototype.sourceToRendered = function (n) {
  return n;
};

WalkontableColumnFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableColumnFilter.prototype.unOffsettedTH = function (n) {
  return n + this.countTH;
};

WalkontableColumnFilter.prototype.visibleRowHeadedColumnToSourceColumn = function (n) {
  return this.renderedToSource(this.offsettedTH(n));
};

WalkontableColumnFilter.prototype.sourceColumnToVisibleRowHeadedColumn = function (n) {
  return this.unOffsettedTH(this.sourceToRendered(n));
};
