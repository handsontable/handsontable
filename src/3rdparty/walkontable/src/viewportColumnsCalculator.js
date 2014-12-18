function WalkontableViewportColumnsCalculator (width, scrollOffset, totalColumns, columnWidthFn, overrideFn, stretchH) {
  this.scrollOffset = scrollOffset;
  this.renderStartColumn = null;
  this.renderEndColumn = null;
  this.renderStartPosition = null;
  this.visibleStartColumn = null;
  this.visibleEndColumn = null; // the last FULLY visible column
  this.countRenderedColumns = 0;
  this.countVisibleColumns = 0;
  this.stretchAllRatio = 0;
  this.stretchLastWidth = 0;
  this.stretch = stretchH;


  var i;
  var sum = 0;
  var sumAll = 0;
  var columnWidth;
  var needReverse = true;
  var defaultColumnWidth = 50;
  var startPositions = [];

  var ratio = 1;

  var setColumnWidth = function (i) {
    ratio = ratio || 1;
    var width = columnWidthFn(i);
    if (width === undefined) {
      width = defaultColumnWidth ;
    }
    return width;
  };

  this.doStretch = function (width) {
    for(i = 0; i < totalColumns; i++) {
      columnWidth = setColumnWidth(i);
      sumAll +=columnWidth;
    }

    var remainingSize = sumAll - width;
    if (this.stretch === 'all' && remainingSize < 0){
      this.stretchAllRatio = width / sumAll;
    } else if (this.stretch === 'last' && width !== Infinity) {
      this.stretchLastWidth = -remainingSize + setColumnWidth(totalColumns-1);
    }
  };


  for (i = 0; i< totalColumns; i++) {
    columnWidth = setColumnWidth(i);

    if (sum <= scrollOffset){
      this.renderStartColumn = i;
    }

    if (sum >= scrollOffset && sum + columnWidth <= scrollOffset + width) {
      if (this.visibleStartColumn == null) {
        this.visibleStartColumn = i;
      }
      this.visibleEndColumn = i;
    }
    startPositions.push(sum);
    sum += columnWidth;
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

  if (this.renderStartColumn != null) {
    this.countRenderedColumns = this.renderEndColumn - this.renderStartColumn + 1;
  }
  if (this.visibleStartColumn != null) {
    this.countVisibleColumns = this.visibleEndColumn - this.visibleStartColumn + 1;
  }
}

