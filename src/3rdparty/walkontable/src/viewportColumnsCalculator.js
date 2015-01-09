function WalkontableViewportColumnsCalculator (width, scrollOffset, totalColumns, columnWidthFn, overrideFn, onlyFullyVisible, stretchH) {
  this.scrollOffset = scrollOffset;
  this.startColumn = null;
  this.endColumn = null;
  this.startPosition = null;
  this.count = 0;
  this.stretchAllRatio = 0;
  this.stretchLastWidth = 0;
  this.stretch = stretchH;


  var i;
  var sum = 0;
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
    var columnWidth;
    var sumAll = 0;

    for(var i = 0; i < totalColumns; i++) {
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

    if (sum <= scrollOffset && !onlyFullyVisible){
      this.startColumn = i;
    }

    if (sum >= scrollOffset && sum + columnWidth <= scrollOffset + width) {
      if (this.startColumn == null) {
        this.startColumn = i;
      }
      this.endColumn = i;
    }
    startPositions.push(sum);
    sum += columnWidth;
    if(!onlyFullyVisible) {
      this.endColumn = i;
    }

    if(sum >= scrollOffset + width) {
      needReverse = false;
      break;
    }
  }

  if (this.endColumn == totalColumns - 1 && needReverse) {
    this.startColumn = this.endColumn;
    while(this.startColumn > 0) {
      var viewportSum = startPositions[this.endColumn] + columnWidth - startPositions[this.startColumn - 1];
      if (viewportSum <= width || !onlyFullyVisible) {
        this.startColumn--;
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
}

