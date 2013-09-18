function WalkontableScroll(instance) {
  this.instance = instance;
}

WalkontableScroll.prototype.scrollVertical = function (delta) {
  if (!this.instance.drawn) {
    throw new Error('scrollVertical can only be called after table was drawn to DOM');
  }

  var instance = this.instance
    , newOffset
    , offset = instance.getSetting('offsetRow')
    , fixedCount = instance.getSetting('fixedRowsTop')
    , total = instance.getSetting('totalRows')
    , maxSize = instance.wtViewport.getViewportHeight();

  if (total > 0) {
    newOffset = this.scrollLogicVertical(delta, offset, total, fixedCount, maxSize, function (row) {
      if (row - offset < fixedCount && row - offset >= 0) {
        return instance.getSetting('rowHeight', row - offset);
      }
      else {
        return instance.getSetting('rowHeight', row);
      }
    }, function (isReverse) {
      instance.wtTable.verticalRenderReverse = isReverse;
    });
  }
  else {
    newOffset = 0;
  }

  if (newOffset !== offset) {
    this.instance.wtScrollbars.vertical.scrollTo(newOffset);
  }
  return instance;
};

WalkontableScroll.prototype.scrollHorizontal = function (delta) {
  if (!this.instance.drawn) {
    throw new Error('scrollHorizontal can only be called after table was drawn to DOM');
  }

  var instance = this.instance
    , newOffset
    , offset = instance.getSetting('offsetColumn')
    , fixedCount = instance.getSetting('fixedColumnsLeft')
    , total = instance.getSetting('totalColumns')
    , maxSize = instance.wtViewport.getViewportWidth();

  if (total > 0) {
    newOffset = this.scrollLogicHorizontal(delta, offset, total, fixedCount, maxSize, function (col) {
      if (col - offset < fixedCount && col - offset >= 0) {
        return instance.getSetting('columnWidth', col - offset);
      }
      else {
        return instance.getSetting('columnWidth', col);
      }
    });
  }
  else {
    newOffset = 0;
  }

  if (newOffset !== offset) {
    this.instance.wtScrollbars.horizontal.scrollTo(newOffset);
  }
  return instance;
};

WalkontableScroll.prototype.scrollLogicVertical = function (delta, offset, total, fixedCount, maxSize, cellSizeFn, setReverseRenderFn) {
  var newOffset = offset + delta;

  if (newOffset >= total - fixedCount) {
    newOffset = total - fixedCount - 1;
    setReverseRenderFn(true);
  }

  if (newOffset < 0) {
    newOffset = 0;
  }

  return newOffset;
};

WalkontableScroll.prototype.scrollLogicHorizontal = function (delta, offset, total, fixedCount, maxSize, cellSizeFn) {
  var newOffset = offset + delta
    , sum = 0
    , col;

  if (newOffset > fixedCount) {
    if (newOffset >= total - fixedCount) {
      newOffset = total - fixedCount - 1;
    }

    col = newOffset;
    while (sum < maxSize && col < total) {
      sum += cellSizeFn(col);
      col++;
    }

    if (sum < maxSize) {
      while (newOffset > 0) {
        //if sum still less than available width, we cannot scroll that far (must move offset to the left)
        sum += cellSizeFn(newOffset - 1);
        if (sum < maxSize) {
          newOffset--;
        }
        else {
          break;
        }
      }
    }
  }
  else if (newOffset < 0) {
    newOffset = 0;
  }

  return newOffset;
};

/**
 * Scrolls viewport to a cell by minimum number of cells
 */
WalkontableScroll.prototype.scrollViewport = function (coords) {
  var offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , lastVisibleRow = this.instance.wtTable.getLastVisibleRow()
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , fixedRowsTop = this.instance.getSetting('fixedRowsTop')
    , fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');

  if (this.instance.isNativeScroll) {
    var TD = this.instance.wtTable.getCell(coords);
    if (typeof TD === 'object') {
      var offset = WalkontableDom.prototype.offset(TD);
      var outerHeight = WalkontableDom.prototype.outerHeight(TD);
      var scrollY = window.scrollY;
      var clientHeight = document.documentElement.clientHeight;
      if (outerHeight < clientHeight) {
        if (offset.top < scrollY) {
          TD.scrollIntoView(true);
        }
        else if (offset.top + outerHeight > scrollY + clientHeight) {
          TD.scrollIntoView(false);
        }
      }
      return;
    }
  }

  if (coords[0] < 0 || coords[0] > totalRows - 1) {
    throw new Error('row ' + coords[0] + ' does not exist');
  }
  else if (coords[1] < 0 || coords[1] > totalColumns - 1) {
    throw new Error('column ' + coords[1] + ' does not exist');
  }

  if (coords[0] > lastVisibleRow) {
//    this.scrollVertical(coords[0] - lastVisibleRow + 1);
    this.scrollVertical(coords[0] - fixedRowsTop - offsetRow);
    this.instance.wtTable.verticalRenderReverse = true;
  }
  else if (coords[0] === lastVisibleRow && this.instance.wtTable.rowStrategy.isLastIncomplete()) {
//    this.scrollVertical(coords[0] - lastVisibleRow + 1);
    this.scrollVertical(coords[0] - fixedRowsTop - offsetRow);
    this.instance.wtTable.verticalRenderReverse = true;
  }
  else if (coords[0] - fixedRowsTop < offsetRow) {
    this.scrollVertical(coords[0] - fixedRowsTop - offsetRow);
  }
  else {
    this.scrollVertical(0); //Craig's issue: remove row from the last scroll page should scroll viewport a row up if needed
  }

  if (this.instance.wtTable.isColumnBeforeViewport(coords[1])) {
    //scroll left
    this.instance.wtScrollbars.horizontal.scrollTo(coords[1] - fixedColumnsLeft);
  }
  else if (this.instance.wtTable.isColumnAfterViewport(coords[1]) || (this.instance.wtTable.getLastVisibleColumn() === coords[1] && !this.instance.wtTable.isLastColumnFullyVisible())) {
    //scroll right
    var sum = 0;
    for (var i = 0; i < fixedColumnsLeft; i++) {
      sum += this.instance.getSetting('columnWidth', i);
    }
    var scrollTo = coords[1];
    sum += this.instance.getSetting('columnWidth', scrollTo);
    var available = this.instance.wtViewport.getViewportWidth();
    if (sum < available) {
      var next = this.instance.getSetting('columnWidth', scrollTo - 1);
      while (sum + next < available && scrollTo >= fixedColumnsLeft) {
        scrollTo--;
        sum += next;
      }
    }

    this.instance.wtScrollbars.horizontal.scrollTo(scrollTo - fixedColumnsLeft);
  }
  /*else {
   //no scroll
   }*/

  return this.instance;
};
