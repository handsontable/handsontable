/**
 * WalkontableCellStrategy
 * @constructor
 */
function WalkontableCellStrategy() {
}

WalkontableCellStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index];
};

WalkontableCellStrategy.prototype.getContainerSize = function (proposedSize) {
  return typeof this.containerSizeFn === 'function' ? this.containerSizeFn(proposedSize) : this.containerSizeFn;
};

WalkontableCellStrategy.prototype.countVisible = function () {
  return this.cellCount;
};

WalkontableCellStrategy.prototype.isLastIncomplete = function () {
  return this.remainingSize >= 0;
};