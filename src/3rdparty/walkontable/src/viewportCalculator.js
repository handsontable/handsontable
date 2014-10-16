function WalkontableViewportCalculator(height, scrollOffset, totalRows, rowHeightFn, override, strict) {
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
      if (strict) {
        throw new Error("Row height function did not return real row height");
      }
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
        if (strict) {
          throw new Error("Row height function did not return real row height");
        }
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

  if (override) {
    override(this);
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