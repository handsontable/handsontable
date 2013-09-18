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

WalkontableRowStrategy.prototype.add = function (i, TD, reverse) {
  if (!this.isLastIncomplete()) {
    var size = this.sizeAtIndex(i, TD);
    if (size === void 0) {
      return false; //total rows exceeded
    }
    var containerSize = this.getContainerSize(this.cellSizesSum + size);
    if (reverse) {
      this.cellSizes.unshift(size);
    }
    else {
      this.cellSizes.push(size);
    }
    this.cellSizesSum += size;
    this.cellCount++;
    this.remainingSize = this.cellSizesSum - containerSize;

    if (reverse && this.isLastIncomplete()) { //something is outside of the screen, maybe even some full rows?
      return false;
    }
    return true;
  }
  return false;
};

WalkontableRowStrategy.prototype.remove = function () {
  var size = this.cellSizes.pop();
  this.cellSizesSum -= size;
  this.cellCount--;
  this.remainingSize -= size;
};

WalkontableRowStrategy.prototype.removeOutstanding = function () {
  while (this.cellCount > 0 && this.cellSizes[this.cellCount - 1] < this.remainingSize) { //this row is completely off screen!
    this.remove();
  }
};