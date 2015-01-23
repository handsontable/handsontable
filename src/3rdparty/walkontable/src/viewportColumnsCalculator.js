function WalkontableViewportColumnsCalculator (width, scrollOffset, totalColumns, columnWidthFn, overrideFn, onlyFullyVisible, stretchH) {
  var
    _this = this,
    ratio = 1,
    sum = 0,
    needReverse = true,
    defaultColumnWidth = 50,
    startPositions = [],
    getColumnWidth,
    columnWidth, i;

  this.scrollOffset = scrollOffset;
  this.startColumn = null;
  this.endColumn = null;
  this.startPosition = null;
  this.count = 0;
  this.stretchAllRatio = 0;
  this.stretchLastWidth = 0;
  this.stretch = stretchH;
  this.totalTargetWidth = 0;
  this.needVerifyLastColumnWidth = true;
  this.stretchAllColumnsWidth = [];


  function getStretchedAllColumnWidth(column, baseWidth) {
    var sumRatioWidth = 0;

    if (!_this.stretchAllColumnsWidth[column]) {
      _this.stretchAllColumnsWidth[column] = Math.round(baseWidth * _this.stretchAllRatio);
    }
    if (_this.stretchAllColumnsWidth.length === totalColumns && _this.needVerifyLastColumnWidth) {
      _this.needVerifyLastColumnWidth = false;

      for (var i = 0; i < _this.stretchAllColumnsWidth.length; i++) {
        sumRatioWidth += _this.stretchAllColumnsWidth[i];
      }
      if (sumRatioWidth != _this.totalTargetWidth) {
        _this.stretchAllColumnsWidth[_this.stretchAllColumnsWidth.length - 1] += _this.totalTargetWidth - sumRatioWidth;
      }
    }

    return _this.stretchAllColumnsWidth[column];
  }

  function getStretchedLastColumnWidth(column, baseWidth) {
    if (column === totalColumns - 1) {
      return _this.stretchLastWidth;
    }

    return null;
  }

  getColumnWidth = function getColumnWidth(i) {
    var width = columnWidthFn(i);

    ratio = ratio || 1;

    if (width === undefined) {
      width = defaultColumnWidth;
    }

    return width;
  };

  /**
   * Recalculate columns stretching.
   *
   * @param {Number} totalWidth
   */
  this.refreshStretching = function (totalWidth) {
    var sumAll = 0,
      columnWidth,
      remainingSize;

    for (var i = 0; i < totalColumns; i++) {
      columnWidth = getColumnWidth(i);
      sumAll += columnWidth;
    }
    this.totalTargetWidth = totalWidth;
    remainingSize = sumAll - totalWidth;

    if (this.stretch === 'all' && remainingSize < 0) {
      this.stretchAllRatio = totalWidth / sumAll;
      this.stretchAllColumnsWidth = [];
      this.needVerifyLastColumnWidth = true;
    }
    else if (this.stretch === 'last' && totalWidth !== Infinity) {
      this.stretchLastWidth = -remainingSize + getColumnWidth(totalColumns - 1);
    }
  };

  /**
   * Get stretched column width based on stretchH (all or last) setting passed in handsontable instance.
   *
   * @param {Number} column
   * @param {Number} baseWidth
   * @returns {Number|null}
   */
  this.getStretchedColumnWidth = function(column, baseWidth) {
    var result = null;

    if (this.stretch === 'all' && this.stretchAllRatio !== 0) {
      result = getStretchedAllColumnWidth(column, baseWidth);
    }
    else if (this.stretch === 'last' && this.stretchLastWidth !== 0) {
      result = getStretchedLastColumnWidth(column, baseWidth);
    }

    return result;
  };


  for (i = 0; i < totalColumns; i++) {
    columnWidth = getColumnWidth(i);

    if (sum <= scrollOffset && !onlyFullyVisible) {
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

    if (!onlyFullyVisible) {
      this.endColumn = i;
    }
    if (sum >= scrollOffset + width) {
      needReverse = false;
      break;
    }
  }

  if (this.endColumn == totalColumns - 1 && needReverse) {
    this.startColumn = this.endColumn;

    while (this.startColumn > 0) {
      var viewportSum = startPositions[this.endColumn] + columnWidth - startPositions[this.startColumn - 1];

      if (viewportSum <= width || !onlyFullyVisible) {
        this.startColumn--;
      }
      if (viewportSum > width) {
        break;
      }
    }
  }

  if (this.startColumn !== null && overrideFn) {
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

