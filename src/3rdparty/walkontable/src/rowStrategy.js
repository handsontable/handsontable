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
  this.maxOuts = 10; //max outs in one direction (before and after table)
  this.curOuts = this.maxOuts;
}

WalkontableRowStrategy.prototype = new WalkontableAbstractStrategy();

WalkontableRowStrategy.prototype.add = function (i, TD) {
  if(!this.canRenderMoreRows()){
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

  if (this.remainingSize <= size ){
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
  return this.remainingSize <= 0 || this.cellCount - this.visiblCellCount < this.curOuts;
};

WalkontableRowStrategy.prototype.remove = function () {
  var size = this.cellSizes.pop();
  this.cellSizesSum -= size;
  this.cellCount--;
  this.remainingSize -= size;
};

WalkontableRowStrategy.prototype.removeOutstanding = function () {
  while (this.cellCount - this.visiblCellCount > this.curOuts) { //this row is completely off screen!
    this.remove();
  }
};

WalkontableRowStrategy.prototype.countRendered = function () {
  return this.cellCount;
}

WalkontableRowStrategy.prototype.countVisible = function () {
  return this.visiblCellCount;
};

WalkontableRowStrategy.prototype.isLastIncomplete = function () {
  var lastRow = this.instance.wtTable.getLastVisibleRow();
  var firstCol = this.instance.wtTable.getFirstVisibleColumn();
  var cell = this.instance.wtTable.getCell(new WalkontableCellCoords(lastRow, firstCol));
  var cellOffsetTop = Handsontable.Dom.offset(cell).top;
  var cellHeight = Handsontable.Dom.outerHeight(cell);
  var cellEnd = cellOffsetTop + cellHeight;

  var viewportOffsetTop = this.instance.wtScrollbars.horizontal.scrollHandler.offsetTop + this.instance.wtScrollbars.vertical.getScrollPosition();
  var viewportHeight = this.instance.wtViewport.getViewportHeight();
  var viewportEnd = viewportOffsetTop + viewportHeight;


  return viewportEnd < cellEnd;
};
