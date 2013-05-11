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

WalkontableRowStrategy.prototype = new WalkontableCellStrategy();

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