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

WalkontableRowFilter.prototype.offsetted = function (n) {
  return n + this.offset;
};

WalkontableRowFilter.prototype.unOffsetted = function (n) {
  return n - this.offset;
};

WalkontableRowFilter.prototype.fixed = function (n) {
  if (n < this.fixedCount) {
    return n - this.offset;
  }
  else {
    return n;
  }
};

WalkontableRowFilter.prototype.unFixed = function (n) {
  if (n < this.fixedCount) {
    return n + this.offset;
  }
  else {
    return n;
  }
};

WalkontableRowFilter.prototype.visibleToSource = function (n) {
  return this.offsetted(this.fixed(n));
};

WalkontableRowFilter.prototype.sourceToVisible = function (n) {
  return this.unOffsetted(this.unFixed(n));
};

WalkontableRowFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableRowFilter.prototype.visibleColHeadedRowToSourceRow = function (n) {
  return this.visibleToSource(this.offsettedTH(n));
};

WalkontableRowFilter.prototype.sourceRowToVisibleColHeadedRow = function (n) {
  return this.unOffsettedTH(this.sourceToVisible(n));
};
