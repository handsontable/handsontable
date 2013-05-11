/**
 * WalkontableColumnStrategy
 * @param containerSizeFn
 * @param sizeAtIndex
 * @param strategy - all, last, none
 * @constructor
 */
function WalkontableColumnStrategy(containerSizeFn, sizeAtIndex, strategy) {
  var size
    , i = 0;

  this.containerSizeFn = containerSizeFn;
  this.cellSizesSum = 0;
  this.cellSizes = [];
  this.cellCount = 0;
  this.remainingSize = 0;

  //step 1 - determine cells that fit containerSize and cache their widths
  while (true) {
    size = sizeAtIndex(i);
    if (size === void 0) {
      break; //total columns exceeded
    }
    if (this.cellSizesSum >= this.getContainerSize(this.cellSizesSum + size)) {
      break; //total width exceeded
    }
    this.cellSizes.push(size);
    this.cellSizesSum += size;
    this.cellCount++;

    i++;
  }

  var containerSize = this.getContainerSize(this.cellSizesSum);

  this.remainingSize = this.cellSizesSum - containerSize;
  //negative value means the last cell is fully visible and there is some space left for stretching
  //positive value means the last cell is not fully visible

  //step 2 - apply stretching strategy
  if (strategy === 'all') {
    if (this.remainingSize < 0) {
      var ratio = containerSize / this.cellSizesSum;
      var newSize;

      for (i = 0; i < this.cellCount - 1; i++) { //"i < ilen - 1" is needed because last cellSize is adjusted after the loop
        newSize = Math.floor(ratio * this.cellSizes[i]);
        this.remainingSize += newSize - this.cellSizes[i];
        this.cellSizes[i] = newSize;
      }
      this.cellSizes[this.cellCount - 1] -= this.remainingSize;
      this.remainingSize = 0;
    }
  }
  else if (strategy === 'last') {
    if (this.remainingSize < 0) {
      this.cellSizes[this.cellCount - 1] -= this.remainingSize;
      this.remainingSize = 0;
    }
  }
}

WalkontableColumnStrategy.prototype = new WalkontableCellStrategy();