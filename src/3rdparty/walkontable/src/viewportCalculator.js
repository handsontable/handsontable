function WalkontableViewportCalculator(height, scrollOffset, totalRows, rowHeightFn, strict) {
  this.renderStartRow = null;
  this.renderStartPosition = null;
  this.renderEndRow = null;
  this.countRendered = 0;
  var sum = 0;
  var rowHeight;
  for (var i = 0; i < totalRows; i++) {
    rowHeight = rowHeightFn(i);
    if (rowHeight === undefined) {
      if (strict) {
        throw new Error("Row height function did not return real row height");
      }
      rowHeight = 23;
    }
    if (sum <= scrollOffset) {
      this.renderStartRow = i;
      this.renderStartPosition = sum;
    }
    sum += rowHeight;
    this.renderEndRow = i;
    if (sum >= scrollOffset + height) {
      break;
    }
  }

  if (this.renderStartRow != null) {
    this.countRendered = this.renderEndRow - this.renderStartRow + 1;
  }
};