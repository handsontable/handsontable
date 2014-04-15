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
  this.visiblCellCount = 0;
  this.remainingSize = -Infinity;
}

WalkontableRowStrategy.prototype = new WalkontableAbstractStrategy();

WalkontableRowStrategy.prototype.add = function (i, TD) {
  if(!this.canRenderMoreRows() || this.remainingSize == 0){
    return false;
  }

  var size = this.sizeAtIndex(i, TD);

  if (size === void 0) {
    return false; //total rows exceeded
  }

  var containerSize = this.getContainerSize(this.cellSizesSum + size);
  this.cellSizes.push(size);
  this.cellSizesSum += size;

  this.cellCount++;
  this.remainingSize = this.cellSizesSum - containerSize;

  if (this.remainingSize <= 0 ){
    this.visiblCellCount++;
  }

  return true;
};

/**
 * Checks whether the number of already rendered rows does not exceeds the number of rows visible in viewport + maximal
 * number of rows rendered above and below viewport
 * @returns {boolean}
 */
WalkontableRowStrategy.prototype.canRenderMoreRows = function () {
  var nativeScrollbar = this.instance.cloneFrom ? this.instance.cloneFrom.wtScrollbars.vertical : this.instance.wtScrollbars.vertical;
  return this.remainingSize <= 0 || this.cellCount - this.visiblCellCount <= nativeScrollbar.curOuts;
};

WalkontableRowStrategy.prototype.remove = function () {
  var size = this.cellSizes.pop();
  this.cellSizesSum -= size;
  this.cellCount--;
  this.remainingSize -= size;
};

WalkontableRowStrategy.prototype.removeOutstanding = function () {
  var nativeScrollbar = this.instance.cloneFrom ? this.instance.cloneFrom.wtScrollbars.vertical : this.instance.wtScrollbars.vertical;
  while (this.cellCount - this.visiblCellCount > nativeScrollbar.curOuts) { //this row is completely off screen!
    this.remove();
  }
};

WalkontableRowStrategy.prototype.countRendered = function () {
  return this.cellCount;
}

WalkontableRowStrategy.prototype.countVisible = function () {
  return this.visiblCellCount;
};