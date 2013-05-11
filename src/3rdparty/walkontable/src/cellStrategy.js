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
  var containerSize = typeof this.containerSizeFn === 'function' ? this.containerSizeFn(proposedSize) : this.containerSizeFn;
  if (containerSize === void 0 || containerSize === null || containerSize < 1) {
    containerSize = Infinity;
  }
  return containerSize;
};

WalkontableCellStrategy.prototype.countVisible = function () {
  return this.cellCount;
};

WalkontableCellStrategy.prototype.isLastIncomplete = function () {
  return this.remainingSize > 0;
};