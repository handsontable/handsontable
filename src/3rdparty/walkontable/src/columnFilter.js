/**
 * WalkontableColumnFilter
 *
 * @constructor
 * @private
 */
function WalkontableColumnFilter(offset,total, countTH) {
  this.offset = offset;
  this.total = total;
  this.countTH = countTH;
}

WalkontableColumnFilter.prototype.offsetted = function (n) {
  return n + this.offset;
};

WalkontableColumnFilter.prototype.unOffsetted = function (n) {
  return n - this.offset;
};

WalkontableColumnFilter.prototype.renderedToSource = function (n) {
  return this.offsetted(n);
};

WalkontableColumnFilter.prototype.sourceToRendered = function (n) {
  return this.unOffsetted(n);
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
