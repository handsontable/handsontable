/**
 * WalkontableColumnStrategy
 * @param containerSizeFn
 * @param cellRanges
 * @param sizeAtIndex
 * @param strategy - all, last, none
 * @constructor
 */
function WalkontableColumnStrategy(containerSizeFn, cellRanges, sizeAtIndex, strategy) {
  var low
    , high
    , cur
    , last = -1
    , size
    , i
    , ilen;

  this.containerSizeFn = containerSizeFn;
  this.cellSizesSum = 0;
  this.cellSizes = {};
  this.cells = [];
  this.cellCount = 0;
  this.remainingSize = 0;

  if (!cellRanges) {
    return;
  }
  else if (cellRanges % 2 === 1) {
    throw new Error('cellRanges must have even number of elements');
  }
  else if (!this.isSorted(cellRanges)) {
    throw new Error('cellRanges must be in ascending order');
  }

  //step 1 - determine cells that fit containerSize and cache their widths
  for (i = 0, ilen = cellRanges.length / 2; i < ilen; i++) {
    low = cellRanges[2 * i];
    high = cellRanges[2 * i + 1];
    cur = low;
    while (cur <= high) {
      size = sizeAtIndex(cur);
      if (this.cellSizesSum >= this.getContainerSize(this.cellSizesSum + size)) {
        break;
      }
      if (cur > last) {
        this.cellSizes[cur] = size;
        this.cellSizesSum += size;
        this.cells.push(cur);
        this.cellCount++;
        last = cur;
      }
      cur++;
    }
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
        cur = this.cells[i];
        newSize = Math.floor(ratio * this.cellSizes[cur]);
        this.remainingSize += newSize - this.cellSizes[cur];
        this.cellSizes[cur] = newSize;
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

WalkontableColumnStrategy.prototype.isSorted = function (cellRanges) {
  for (var i = 0, ilen = cellRanges.length; i < ilen; i++) {
    if (i > 0) {
      if (cellRanges[i - 1] > cellRanges[i]) {
        return false;
      }
    }
  }
  return true;
};