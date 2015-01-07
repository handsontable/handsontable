/**
 * Viewport calculator constructor. Calculates indexes of rows to render and the indexes of rows that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * Object properties:
 *   this.scrollOffset - position of vertical scroll (in px)
 *   this.startRow - index of the first rendered row (can be overwritten using overrideFn)
 *   this.startPosition - position of the first rendered row (in px)
 *   this.endRow - index of the last rendered row (can be overwritten using overrideFn)
 *   this.count - number of rendered rows
 *   this.visibleStartRow - index of the first fully visible row
 *   this.visibleEndRow - index of the last fully visible row
 *   this.count - number of visible rows
 *
 * @param height - height of the viewport
 * @param scrollOffset - current vertical scroll position of the viewport
 * @param totalRows - total number of rows
 * @param rowHeightFn - function that returns the height of the row at a given index (in px)
 * @param overrideFn - function that changes calculated this.startRow, this.endRow (used by mergeCells.js plugin)
 * @constructor
 */
function WalkontableViewportRowsCalculator(height, scrollOffset, totalRows, rowHeightFn, overrideFn, onlyFullyVisible) {
  this.scrollOffset = scrollOffset;
  this.startRow = null;
  this.startPosition = null;
  this.endRow = null;
  this.count = 0;
  this.visibleStartRow = null;
  this.visibleEndRow = null; // the last FULLY visible row
  this.visibleCount = 0;
  var sum = 0;
  var rowHeight;
  var needReverse = true;
  var defaultRowHeight = 23;
  var startPositions = [];
  for (var i = 0; i < totalRows; i++) {
    rowHeight = rowHeightFn(i);
    if (rowHeight === undefined) {
      rowHeight = defaultRowHeight;
    }
    if (sum <= scrollOffset && !onlyFullyVisible) {
      this.startRow = i;
    }
    if (sum >= scrollOffset && sum + rowHeight <= scrollOffset + height) {
      if (this.startRow == null) {
        this.startRow = i;
      }
      if (this.visibleStartRow == null) {
        this.visibleStartRow = i;
      }
      this.visibleEndRow = i;
      this.endRow = i;
    }
    startPositions.push(sum);
    sum += rowHeight;
    if(!onlyFullyVisible) {
      this.endRow = i;
    }
    if (sum >= scrollOffset + height) {
      needReverse = false;
      break;
    }
  }
  //If the rendering has reached the last row and there is still some space available in the viewport, we need to render in reverse in order to fill the whole viewport with rows
  if (this.endRow == totalRows - 1 && needReverse) {
    this.startRow = this.endRow;
    this.visibleStartRow = this.endRow;
    this.visibleEndRow = this.endRow;
    while(this.startRow > 0) {
      this.startRow--;
      var viewportSum = startPositions[this.endRow] + rowHeight - startPositions[this.startRow]; //rowHeight is the height of the last row
      if (viewportSum <= height)
      {
        this.visibleStartRow = this.startRow;
      }
      if (viewportSum >= height)
      {
       break;
      }
    }
  }

  if (this.startRow !== null && overrideFn) {
    overrideFn(this);
  }

  this.startPosition = startPositions[this.startRow];
  if (this.startPosition == void 0) {
    this.startPosition = null;
  }

  if (this.startRow != null) {
    this.count = this.endRow - this.startRow + 1;
  }
  if (this.visibleStartRow != null) {
    this.visibleCount = this.visibleEndRow - this.visibleStartRow + 1;
  }
};
