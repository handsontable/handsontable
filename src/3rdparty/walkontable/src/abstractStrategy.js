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
  return this.remainingSize > 0;
};