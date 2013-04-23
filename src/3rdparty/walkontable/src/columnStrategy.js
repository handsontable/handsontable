/**
 * WalkontableColumnStrategy
 * @param containerSizeFn
 * @param cellIndexFn
 * @param sizeAtIndex
 * @param strategy - all, last, none
 * @constructor
 */
function WalkontableColumnStrategy(containerSizeFn, cellIndexFn, sizeAtIndex, strategy) {
  var source_c
    , last = -1
    , size
    , i = 0
    , ilen;

  this.containerSizeFn = containerSizeFn;
  this.cellSizesSum = 0;
  this.cellSizes = {};
  this.cells = [];
  this.cellCount = 0;
  this.remainingSize = 0;

  //step 1 - determine cells that fit containerSize and cache their widths
  source_c = cellIndexFn(0);
  while (source_c > 0 || source_c === 0) {
    size = sizeAtIndex(source_c);
    if (this.cellSizesSum >= this.getContainerSize(this.cellSizesSum + size)) {
      break;
    }
    this.cellSizes[source_c] = size;
    this.cellSizesSum += size;
    this.cells.push(source_c);
    this.cellCount++;

    i++;
    source_c = cellIndexFn(i);
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

      for (i = 0, ilen = this.cells.length; i < ilen - 1; i++) { //"i < ilen - 1" is needed because last cellSize is adjusted after the loop
        source_c = this.cells[i];
        newSize = Math.floor(ratio * this.cellSizes[source_c]);
        this.remainingSize += newSize - this.cellSizes[source_c];
        this.cellSizes[source_c] = newSize;
      }
      this.cellSizes[ilen - 1] -= this.remainingSize;
      this.remainingSize = 0;
    }
  }
  else if (strategy === 'last') {
    if (this.remainingSize < 0) {
      this.cellSizes[this.cells[this.cells.length - 1]] -= this.remainingSize;
      this.remainingSize = 0;
    }
  }
}

WalkontableColumnStrategy.prototype.getContainerSize = function (proposedWidth) {
  var containerSize = typeof this.containerSizeFn === 'function' ? this.containerSizeFn(proposedWidth) : this.containerSizeFn;
  if (containerSize === void 0 || containerSize === null || containerSize < 1) {
    containerSize = Infinity;
  }
  return containerSize;
};

WalkontableColumnStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index];
};