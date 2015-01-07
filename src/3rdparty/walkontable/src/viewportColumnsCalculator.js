function WalkontableViewportColumnsCalculator (width, scrollOffset, totalColumns, columnWidthFn, overrideFn, stretchH) {
  this.scrollOffset = scrollOffset;
  this.startColumn = null;
  this.endColumn = null;
  this.startPosition = null;
  this.visibleStartColumn = null;
  this.visibleEndColumn = null; // the last FULLY visible column
  this.count = 0;
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

  var getColumnWidth = function (i) {
    ratio = ratio || 1;
    var width = columnWidthFn(i);
    if (width === undefined) {
      width = defaultColumnWidth ;
    }
    return width;
  };

  this.refreshStretching = function (width) {
    for(i = 0; i < totalColumns; i++) {
      columnWidth = getColumnWidth(i);
      sumAll +=columnWidth;
    }

    var remainingSize = sumAll - width;
    if (this.stretch === 'all' && remainingSize < 0){
      this.stretchAllRatio = width / sumAll;
    } else if (this.stretch === 'last' && width !== Infinity) {
      this.stretchLastWidth = -remainingSize + getColumnWidth(totalColumns-1);
    }
  };


  for (i = 0; i< totalColumns; i++) {
    columnWidth = getColumnWidth(i);

    if (sum <= scrollOffset){
      this.startColumn = i;
    }

    if (sum >= scrollOffset && sum + columnWidth <= scrollOffset + width) {
      if (this.visibleStartColumn == null) {
        this.visibleStartColumn = i;
      }
      this.visibleEndColumn = i;
    }
    startPositions.push(sum);
    sum += columnWidth;
    this.endColumn = i;

    if(sum >= scrollOffset + width) {
      needReverse = false;
      break;
    }
  }

  if (this.endColumn == totalColumns - 1 && needReverse) {
    this.startColumn = this.endColumn;
    this.visibleStartColumn = this.endColumn;
    this.visibleEndColumn = this.endColumn;

    while(this.startColumn > 0) {
      this.startColumn--;
      var viewportSum = startPositions[this.endColumn] + columnWidth - startPositions[this.startColumn];
      if (viewportSum <= width) {
        this.visibleStartColumn = this.startColumn;
      }
      if (viewportSum > width) {
        break;
      }
    }
  }

  if (this.startColumn !== null && overrideFn){
    overrideFn(this);
  }

  this.startPosition = startPositions[this.startColumn];
  if (this.startPosition == void 0) {
    this.startPosition = null;
  }

  if (this.startColumn != null) {
    this.count = this.endColumn - this.startColumn + 1;
  }
  if (this.visibleStartColumn != null) {
    this.countVisibleColumns = this.visibleEndColumn - this.visibleStartColumn + 1;
  }
}

