/**
 * WalkontableRowFilter
 * @constructor
 */
function WalkontableRowFilter(offset, total, fixedCount) {
  this.offset = offset;
  this.total = total;
  this.fixedCount = fixedCount;
}

WalkontableRowFilter.prototype = new WalkontableAbstractFilter();