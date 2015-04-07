/**
 * Viewport calculator constructor. Calculates indexes of rows to render OR rows that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * Object properties:
 *   this.scrollOffset - position of vertical scroll (in px)
 *   this.startRow - index of the first rendered/visible row (can be overwritten using overrideFn)
 *   this.startPosition - position of the first rendered/visible row (in px)
 *   this.endRow - index of the last rendered/visible row (can be overwritten using overrideFn)
 *   this.count - number of rendered/visible rows
 *
 * @param height - height of the viewport
 * @param scrollOffset - current vertical scroll position of the viewport
 * @param totalRows - total number of rows
 * @param rowHeightFn - function that returns the height of the row at a given index (in px)
 * @param overrideFn - function that changes calculated this.startRow, this.endRow (used by mergeCells.js plugin)
 * @param onlyFullyVisible {bool} - if TRUE, only startRow and endRow will be indexes of rows that are FULLY in viewport
 * @constructor
 * @private
 */
function WalkontableViewportRowsCalculator(height, scrollOffset, totalRows, rowHeightFn, overrideFn, onlyFullyVisible) {
  this.scrollOffset = scrollOffset;
  this.startRow = null;
  this.startPosition = null;
  this.endRow = null;
  this.count = 0;
  var sum = 0;
  var rowHeight;
  var needReverse = true;
  var defaultRowHeight = 23;
  var startPositions = [];

  // Calculate the number (start and end index) of rows needed
  for (var i = 0; i < totalRows; i++) {
    rowHeight = rowHeightFn(i);
    if (rowHeight === undefined) {
      rowHeight = defaultRowHeight;
    }
    if (sum <= scrollOffset && !onlyFullyVisible) {
      this.startRow = i;
    }

    // the row is within the "visible range"
    if (sum >= scrollOffset && sum + rowHeight <= scrollOffset + height) {
      if (this.startRow == null) {
        this.startRow = i;
      }
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

  //If the estimation has reached the last row and there is still some space available in the viewport, we need to render in reverse in order to fill the whole viewport with rows
  if (this.endRow == totalRows - 1 && needReverse) {
    this.startRow = this.endRow;
    while(this.startRow > 0) {
      var viewportSum = startPositions[this.endRow] + rowHeight - startPositions[this.startRow - 1]; //rowHeight is the height of the last row
      if (viewportSum <= height || !onlyFullyVisible)
      {
        this.startRow--;
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
}
