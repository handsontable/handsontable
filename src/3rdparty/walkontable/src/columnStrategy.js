/**
 * WalkontableColumnStrategy
 * @param containerSizeFn
 * @param sizeAtIndex
 * @param strategy - all, last, none
 * @constructor
 */
function WalkontableColumnStrategy(instance, containerSizeFn, sizeAtIndex, strategy) {
  var size
    , i = 0;

  WalkontableAbstractStrategy.apply(this, arguments);

  this.containerSizeFn = containerSizeFn;
  this.cellSizesSum = 0;
  this.cellSizes = [];
  this.cellStretch = [];
  this.cellCount = 0;
  this.visibleCellCount = 0;
  this.remainingSize = 0;
  this.strategy = strategy;

  //step 1 - determine cells that fit containerSize and cache their widths
  while (true) {
    size = sizeAtIndex(i);
    if (size === void 0) {
      break; //total columns exceeded
    }
    if (this.cellSizesSum < this.getContainerSize(this.cellSizesSum + size)) {
      this.visibleCellCount++;
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
}

WalkontableColumnStrategy.prototype = new WalkontableAbstractStrategy();

WalkontableColumnStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index] + (this.cellStretch[index] || 0);
};

WalkontableColumnStrategy.prototype.stretch = function () {
  //step 2 - apply stretching strategy
  var containerSize
    , i = 0;

  containerSize = this.instance.wtTable.allRowsInViewport() ? this.getContainerSize() : this.getContainerSize(Infinity);

  this.remainingSize = this.cellSizesSum - containerSize;

  this.cellStretch.length = 0; //clear previous stretch

  if (this.strategy === 'all') {
    if (this.remainingSize < 0) {
      var ratio = containerSize / this.cellSizesSum;
      var newSize;

      while (i < this.cellCount - 1) { //"i < this.cellCount - 1" is needed because last cellSize is adjusted after the loop
        newSize = Math.floor(ratio * this.cellSizes[i]);
        this.remainingSize += newSize - this.cellSizes[i];
        this.cellStretch[i] = newSize - this.cellSizes[i];
        i++;
      }
      this.cellStretch[this.cellCount - 1] = -this.remainingSize;
      this.remainingSize = 0;
    }
  }
  else if (this.strategy === 'last') {
    if (this.remainingSize < 0 && containerSize !== Infinity) { //Infinity is with native scroll when the table is wider than the viewport (TODO: test)
      this.cellStretch[this.cellCount - 1] = -this.remainingSize;
      this.remainingSize = 0;
    }
  }
};

WalkontableColumnStrategy.prototype.countVisible = function () {
  return this.visibleCellCount;
};

WalkontableColumnStrategy.prototype.isLastIncomplete = function () {

  var firstRow = this.instance.wtTable.getFirstVisibleRow();
  var lastCol = this.instance.wtTable.getLastVisibleColumn();
  var cell = this.instance.wtTable.getCell(new WalkontableCellCoords(firstRow, lastCol));
  var cellOffset = Handsontable.Dom.offset(cell);
  var cellWidth = Handsontable.Dom.outerWidth(cell);
  var cellEnd = cellOffset.left + cellWidth;

  var viewportOffsetLeft = this.instance.wtScrollbars.vertical.getScrollPosition();
  var viewportWitdh = this.instance.wtViewport.getViewportWidth();
  var viewportEnd = viewportOffsetLeft + viewportWitdh;


  return viewportEnd >= cellEnd;
};
