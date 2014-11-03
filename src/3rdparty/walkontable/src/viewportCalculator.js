/**
 * Viewport calculator constructor. Calculates indexes of rows to render and the indexes of rows that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * Object properties:
 *   this.scrollOffset - position of vertical scroll (in px)
 *   this.renderStartRow - index of the first rendered row (can be overwritten using overrideFn)
 *   this.renderStartPosition - position of the first rendered row (in px)
 *   this.renderEndRow - index of the last rendered row (can be overwritten using overrideFn)
 *   this.countRendered - number of rendered rows
 *   this.visibleStartRow - index of the first fully visible row
 *   this.visibleEndRow - index of the last fully visible row
 *   this.countRendered - number of visible rows
 *
 * @param height - height of the viewport
 * @param scrollOffset - current vertical scroll position of the viewport
 * @param totalRows - total number of rows
 * @param rowHeightFn - function that returns the height of the row at a given index (in px)
 * @param overrideFn - function that changes calculated this.renderStartRow, this.renderEndRow (used by mergeCells.js plugin)
 * @constructor
 */
function WalkontableViewportCalculator(height, scrollOffset, totalRows, rowHeightFn, overrideFn) {
  this.scrollOffset = scrollOffset;
  this.renderStartRow = null;
  this.renderStartPosition = null;
  this.renderEndRow = null;
  this.countRendered = 0;
  this.visibleStartRow = null;
  this.visibleEndRow = null;
  this.countVisible = 0;
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
    if (sum <= scrollOffset) {
      this.renderStartRow = i;
    }
    if (sum >= scrollOffset && sum + rowHeight <= scrollOffset + height) {
      if (this.visibleStartRow == null) {
        this.visibleStartRow = i;
      }
      this.visibleEndRow = i;
    }
    startPositions.push(sum);
    sum += rowHeight;
    this.renderEndRow = i;
    if (sum >= scrollOffset + height) {
      needReverse = false;
      break;
    }
  }

  if (this.renderEndRow == totalRows - 1 && needReverse) {
    i = this.renderStartRow - 1;
    sum = startPositions[this.renderEndRow] - startPositions[this.renderStartRow] + rowHeight; //now sum is just the height of the rendered cells
    while (i > -1) {
      rowHeight = rowHeightFn(i);
      if (rowHeight === undefined) {
        rowHeight = defaultRowHeight;
      }
      this.renderStartRow = i;
      sum += rowHeight;
      if (sum <= height) {
        this.visibleStartRow = i;
      }

      if (sum >= height) {
        break;
      }

      i--;
    }
  }

  if (overrideFn) {
    overrideFn(this);
  }

  this.renderStartPosition = startPositions[this.renderStartRow];
  if (this.renderStartPosition == void 0) {
    this.renderStartPosition = null;
  }

  if (this.renderStartRow != null) {
    this.countRendered = this.renderEndRow - this.renderStartRow + 1;
  }
  if (this.visibleStartRow != null) {
    this.countVisible = this.visibleEndRow - this.visibleStartRow + 1;
  }
};
