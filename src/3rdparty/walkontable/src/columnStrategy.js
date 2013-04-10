/**
 * WalkontableColumnStrategy
 * @param containerSizeFn
 * @param cellRanges
 * @param sizeAtIndex
 * @param strategy - all, last, none
 * @constructor
 */
function WalkontableColumnStrategy(containerSizeFn, cellRanges, sizeAtIndex, strategy) {
  if (!cellRanges) {
    throw new Error('cellRanges not set');
  }
  else if (cellRanges % 2 === 1) {
    throw new Error('cellRanges must have even number of elements');
  }
  else if (!this.isSorted(cellRanges)) {
    throw new Error('cellRanges must be in ascending order');
  }

  this.containerSizeFn = containerSizeFn;
  this.cacheLength = 0;
  this.cacheTotalSize = 0;
  this.cache = {};
  this.visibleCellRanges = [];

  var low
    , high
    , cur
    , size
    , i
    , ilen;

  //step 1 - determine cells that fit containerSize and cache their widths
  for (i = 0, ilen = cellRanges.length / 2; i < ilen; i++) {
    low = cellRanges[2 * i];
    high = cellRanges[2 * i + 1];
    cur = low;
    while (cur <= high) {
      size = sizeAtIndex(cur);
      if (this.cacheTotalSize >= this.getContainerSize(this.cacheTotalSize + size)) {
        break;
      }
      this.cache[cur] = size;
      this.cacheTotalSize += size;
      this.cacheLength++;

      if (cur === low) {
        this.visibleCellRanges[2 * i] = cur;
      }
      this.visibleCellRanges[2 * i + 1] = cur;

      cur++;
    }
    if (this.cacheTotalSize >= this.getContainerSize(this.cacheTotalSize)) {
      break;
    }
  }

  var containerSize = this.getContainerSize(this.cacheTotalSize)
    , remainingSize = containerSize - this.cacheTotalSize;

  //step 2 - apply stretching strategy
  if (strategy === 'all') {
    var ratio = containerSize / this.cacheTotalSize;
    var newSize;

    if (ratio > 1) { //if the ratio is smaller than 1 then it means last cell is not completely visible (=there is nothing to stretch)
      for (i = 0, ilen = this.visibleCellRanges.length / 2; i < ilen; i++) {
        low = this.visibleCellRanges[2 * i];
        high = this.visibleCellRanges[2 * i + 1];
        cur = low;
        while (cur <= high) {
          if (i === ilen - 1 && cur === high) {
            this.cache[cur] += remainingSize;
          }
          else {
            newSize = Math.floor(ratio * this.cache[cur]);
            remainingSize -= newSize - this.cache[cur];
            this.cache[cur] = newSize;
          }
          cur++;
        }
      }

    }
  }
  else if (strategy === 'last') {
    if (remainingSize > 0) {
      this.cache[this.visibleCellRanges[this.visibleCellRanges.length - 1]] += remainingSize;
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
  return this.cache[index];
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