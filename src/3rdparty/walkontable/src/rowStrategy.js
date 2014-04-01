/**
 * WalkontableRowStrategy
 * @param containerSizeFn
 * @param sizeAtIndex
 * @constructor
 */
function WalkontableRowStrategy(instance, containerSizeFn, sizeAtIndex) {

  WalkontableAbstractStrategy.apply(this, arguments);

  this.containerSizeFn = containerSizeFn;
  this.sizeAtIndex = sizeAtIndex;
  this.cellSizesSum = 0;
  this.cellSizes = [];
  this.cellCount = 0;
  this.remainingSize = -Infinity;
}

WalkontableRowStrategy.prototype = new WalkontableAbstractStrategy();

WalkontableRowStrategy.prototype.add = function (i, TD) {
  if (!this.isLastIncomplete() && this.remainingSize != 0) {
    var size = this.sizeAtIndex(i, TD);
    if (size === void 0) {
      return false; //total rows exceeded
    }
    var containerSize = this.getContainerSize(this.cellSizesSum + size);
    this.cellSizes.push(size);
    this.cellSizesSum += size;
    this.cellCount++;
    this.remainingSize = this.cellSizesSum - containerSize;
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