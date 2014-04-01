/**
 * WalkontableAbstractStrategy (WalkontableColumnStrategy and WalkontableRowStrategy inherit from this)
 * @constructor
 */
function WalkontableAbstractStrategy(instance) {
  this.instance = instance;
}

WalkontableAbstractStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index];
};

WalkontableAbstractStrategy.prototype.getContainerSize = function (proposedSize) {
  return typeof this.containerSizeFn === 'function' ? this.containerSizeFn(proposedSize) : this.containerSizeFn;
};

WalkontableAbstractStrategy.prototype.countVisible = function () {
  return this.cellCount;
};

WalkontableAbstractStrategy.prototype.isLastIncomplete = function () {
  var nativeScrollbar = this.instance.cloneFrom ? this.instance.cloneFrom.wtScrollbars.vertical : this.instance.wtScrollbars.vertical;
  return this.remainingSize > nativeScrollbar.sumCellSizes(nativeScrollbar.offset, nativeScrollbar.offset + nativeScrollbar.curOuts + 1);
};