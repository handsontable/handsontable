function WalkontableViewportColumnsCalculator (width, scrollOffset, totalColumns, columnWidthFn, overrideFn, stretchH) {
  this.scrollOffset = scrollOffset;
  this.renderStartColumn = null;
  this.renderEndColumn = null;
  this.renderStartPosition = null;
  this.visibleStartColumn = null;
  this.visibleEndColumn = null;
  this.countRenderedColumns = 0;
  this.countVisibleColumns = 0;
  this.stretch = stretchH;

  var sum = 0;
  var columnWidth;
  var needReverse = true;
  var defaultColumnWidth = 50;
  var startPositions = [];

  for (var i = 0; i< totalColumns; i++) {
    columnWidth = columnWidthFn[i];
    if (columnWidth === undefined) {
      columnWidth = defaultColumnWidth;
    }

    if (sum <= scrollOffset){
      this.renderStartColumn = i;
    }

    if (sum >= scrollOffset && sum + columnWidth <=scrollOffset + width) {
      if (this.visibleStartColumn == null) {
        this.visibleStartColumn = i;
      }
      this.visibleEndColumn = i;
    }
    startPositions.push(sum);
    sum +=columnWidth;
    this.renderEndColumn = i;

    if(sum >= scrollOffset + width) {
      needReverse = false;
      break;
    }
  }


  if (this.renderEndColumn == totalColumns - 1 && needReverse) {
    this.renderStartColumn = this.renderEndColumn;
    this.visibleStartColumn = this.renderEndColumn;
    this.visibleEndColumn = this.renderEndColumn;

    while(this.renderStartColumn > 0) {
      this.renderStartColumn--;
      var viewportSum = startPositions[this.renderEndColumn] + columnWidth - startPositions[this.renderStartColumn];
      if (viewportSum <= width) {
        this.visibleStartColumn = this.renderStartColumn;
      }
      if (viewportSum > width) {
        break;
      }
    }
  }

  if (this.renderStartColumn !== null && overrideFn){
    overrideFn(this);
  }

  this.renderStartPosition = startPositions[this.renderStartColumn];
  if (this.renderStartPosition == void 0) {
    this.renderStartPosition = null;
  }

  if (this.renderStartPosition != null) {
    this.countRenderedColumns = this.renderEndColumn - this.renderStartColumn + 1;
  }
  if (this.visibleStartColumn != null) {
    this.countVisibleColumns = this.visibleEndColumn - this.visibleStartColumn + 1;
  }


  //var remainingSize = width - sum;
  if (this.stretchH === 'all') {
    //if (this.remainingSize < 0) {
    //  var ratio = width / this.cellSizesSum;
    //  var newSize;
		//
    //  while (i < this.cellCount - 1) { //"i < this.cellCount - 1" is needed because last cellSize is adjusted after the loop
    //    newSize = Math.floor(ratio * this.cellSizes[i]);
    //    this.remainingSize += newSize - this.cellSizes[i];
    //    this.cellStretch[i] = newSize - this.cellSizes[i];
    //    i++;
    //  }
    //  this.cellStretch[this.cellCount - 1] = -this.remainingSize;
    //  this.remainingSize = 0;
    //}
  }
  else if (this.stretchH === 'last') {
    //if (this.remainingSize < 0 && containerSize !== Infinity) { //Infinity is with native scroll when the table is wider than the viewport (TODO: test)
    //  this.cellStretch[this.cellCount - 1] = -this.remainingSize;
    //  this.remainingSize = 0;
    //}
  }
}

