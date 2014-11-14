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

  var i;
  var sum = 0;
  var sumAll = 0;
  var columnWidth;
  var needReverse = true;
  var defaultColumnWidth = 50;
  var startPositions = [];

  for (i = 0; i< totalColumns; i++) {
    columnWidth = columnWidthFn(i);
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

  for(i = 0; i < totalColumns; i++) {
    columnWidth = columnWidthFn(i);
    if (columnWidth === undefined) {
      columnWidth = defaultColumnWidth;
    }
    sumAll +=columnWidth;
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

  if (this.renderStartColumn != null) {
    this.countRenderedColumns = this.renderEndColumn - this.renderStartColumn + 1;
  }
  if (this.visibleStartColumn != null) {
    this.countVisibleColumns = this.visibleEndColumn - this.visibleStartColumn + 1;
  }


  this.stretch = function () {
    var i = 0;

    var remainingSize = width - sumAll;

    if (this.stretchH === 'all') {
      if (remainingSize < 0) {
        var ratio = width / sumAll;
        var newSize;

        //while (i < this.cellCount - 1) { //"i < this.cellCount - 1" is needed because last cellSize is adjusted after the loop
        //  newSize = Math.floor(ratio * this.cellSizes[i]);
        //  this.remainingSize += newSize - this.cellSizes[i];
        //  this.cellStretch[i] = newSize - this.cellSizes[i];
        //  i++;
        //}
        //this.cellStretch[this.cellCount - 1] = -this.remainingSize;
        //this.remainingSize = 0;
      }
    }
    else if (this.stretchH === 'last') {
      if (remainingSize < 0 && width !== Infinity) { //Infinity is with native scroll when the table is wider than the viewport (TODO: test)
        //this.cellStretch[this.cellCount - 1] = -this.remainingSize;
        //this.remainingSize = 0;
      }
    }
  };


}

