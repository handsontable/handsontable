/**
 * WalkontableRowFilter
 *
 * @constructor
 * @private
 */
function WalkontableRowFilter(offset, total, countTH) {
  this.offset = offset;
  this.total = total;
  this.countTH = countTH;
}

WalkontableRowFilter.prototype.offsetted = function (n) {
  return n + this.offset;
};

WalkontableRowFilter.prototype.unOffsetted = function (n) {
  return n - this.offset;
};

WalkontableRowFilter.prototype.renderedToSource = function (n) {
  return this.offsetted(n);
};

WalkontableRowFilter.prototype.sourceToRendered = function (n) {
  return this.unOffsetted(n);
};

WalkontableRowFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableRowFilter.prototype.visibleColHeadedRowToSourceRow = function (n) {
  return this.renderedToSource(this.offsettedTH(n));
};

WalkontableRowFilter.prototype.sourceRowToVisibleColHeadedRow = function (n) {
  return this.unOffsettedTH(this.sourceToRendered(n));
};
