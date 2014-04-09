/**
 * WalkontableAbstractFilter (WalkontableColumnFilter and WalkontableRowFilter inherit from this)
 * @constructor
 */
function WalkontableAbstractFilter() {
  this.offset = 0;
  this.total = 0;
  this.fixedCount = 0;
}

WalkontableAbstractFilter.prototype.offsetted = function (n) {
  return n + this.offset;
};

WalkontableAbstractFilter.prototype.unOffsetted = function (n) {
  return n - this.offset;
};

WalkontableAbstractFilter.prototype.fixed = function (n) {
  if (n < this.fixedCount) {
    return n - this.offset;
  }
  else {
    return n;
  }
};

WalkontableAbstractFilter.prototype.unFixed = function (n) {
  if (n < this.fixedCount) {
    return n + this.offset;
  }
  else {
    return n;
  }
};

WalkontableAbstractFilter.prototype.visibleToSource = function (n) {
  return this.offsetted(this.fixed(n));
};

WalkontableAbstractFilter.prototype.sourceToVisible = function (n) {
  return this.unOffsetted(this.unFixed(n));
};