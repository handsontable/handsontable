/**
 * WalkontableRowStrategy
 * @param containerSizeFn
 * @param sizeAtIndex
 * @constructor
 */
function WalkontableRowStrategy(containerSizeFn, sizeAtIndex) {
  this.containerSizeFn = containerSizeFn;
  this.sizeAtIndex = sizeAtIndex;
  this.cellSizesSum = 0;
  this.cellSizes = [];
  this.cellCount = 0;
  this.remainingSize = -Infinity;
}

WalkontableRowStrategy.prototype.add = function (i, TD) {
  if (this.remainingSize < 0) {
    var size = this.sizeAtIndex(i, TD);
    if (size === void 0) {
      return; //total rows exceeded
    }
    var containerSize = this.getContainerSize(this.cellSizesSum + size);
    this.cellSizes.push(size);
    this.cellSizesSum += size;
    this.cellCount++;
    this.remainingSize = this.cellSizesSum - containerSize;
  }
};

WalkontableRowStrategy.prototype.getContainerSize = function (proposedSize) {
  var containerSize = typeof this.containerSizeFn === 'function' ? this.containerSizeFn(proposedSize) : this.containerSizeFn;
  if (containerSize === void 0 || containerSize === null || containerSize < 1) {
    containerSize = Infinity;
  }
  return containerSize;
};

WalkontableRowStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index];
};