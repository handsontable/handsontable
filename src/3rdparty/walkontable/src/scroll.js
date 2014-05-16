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

  if (total > 0 && !this.instance.wtTable.isLastRowFullyVisible()) {
    newOffset = this.scrollLogicVertical(delta, offset, total, fixedCount, maxSize, function (row) {
      if (row - offset < fixedCount && row - offset >= 0) {
        return instance.getSetting('rowHeight', row - offset);
      }
      else {
        return instance.getSetting('rowHeight', row);
      }
    });

  } else {
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

WalkontableScroll.prototype.scrollLogicVertical = function (delta, offset, total, fixedCount, maxSize, cellSizeFn) {
  var newOffset = offset + delta;

  if (newOffset >= total - fixedCount) {
    newOffset = total - fixedCount - 1;
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
 * @param {WalkontableCellCoords} coords
 */
WalkontableScroll.prototype.scrollViewport = function (coords) {
  if (!this.instance.drawn) {
    return;
  }

  var offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , fixedRowsTop = this.instance.getSetting('fixedRowsTop')
    , fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');


  if (coords.row < 0 || coords.row > totalRows - 1) {
    throw new Error('row ' + coords.row + ' does not exist');
  }

  if (coords.col < 0 || coords.col > totalColumns - 1) {
    throw new Error('column ' + coords.col + ' does not exist');
  }

  var TD = this.instance.wtTable.getCell(coords);
  if (typeof TD === 'object') {
    this.scrollToRenderedCell(TD);

  }  else if (coords.row >= this.instance.wtTable.getLastVisibleRow()) {
    this.scrollVertical(coords.row - this.instance.wtTable.getLastVisibleRow());

    if (coords.row == this.instance.wtTable.getLastVisibleRow() && this.instance.wtTable.getRowStrategy().isLastIncomplete()){
      this.scrollViewport(coords)
    }

    this.instance.wtTable.verticalRenderReverse = true;
  } else if (coords.row >= 0) {
    this.scrollVertical(coords.row - this.instance.wtTable.getFirstVisibleRow());
  }
};

WalkontableScroll.prototype.scrollToRenderedCell = function (TD) {
  var cellOffset = WalkontableDom.prototype.offset(TD);
  var cellWidth = WalkontableDom.prototype.outerWidth(TD);
  var cellHeight = WalkontableDom.prototype.outerHeight(TD);
  var workspaceOffset = WalkontableDom.prototype.offset(this.instance.wtTable.TABLE);
  var viewportScrollPosition = {
    left: this.instance.wtScrollbars.horizontal.getScrollPosition(),
    top: this.instance.wtScrollbars.vertical.getScrollPosition()
  };

  var workspaceWidth = this.instance.wtViewport.getWorkspaceWidth();
  var workspaceHeight = this.instance.wtViewport.getWorkspaceHeight();
  var verticalCloneWidth = this.instance.wtDom.outerWidth(this.instance.wtScrollbars.horizontal.clone.wtTable.TABLE);
  var horizontalCloneHeight = this.instance.wtDom.outerHeight(this.instance.wtScrollbars.vertical.clone.wtTable.TABLE);

  if (this.instance.wtScrollbars.horizontal.scrollHandler !== window) {
    workspaceOffset.left = 0;
    cellOffset.left -= WalkontableDom.prototype.offset(this.instance.wtScrollbars.horizontal.scrollHandler).left;
  }

  if (this.instance.wtScrollbars.vertical.scrollHandler !== window) {
    workspaceOffset.top = 0;
    cellOffset.top = cellOffset.top - WalkontableDom.prototype.offset(this.instance.wtScrollbars.vertical.scrollHandler).top;
  }

  if (cellWidth < workspaceWidth) {
    if (cellOffset.left < viewportScrollPosition.left + verticalCloneWidth) {
      this.instance.wtScrollbars.horizontal.setScrollPosition(cellOffset.left - verticalCloneWidth);
    }
    else if (cellOffset.left + cellWidth > workspaceOffset.left + viewportScrollPosition.left + workspaceWidth) {
      var delta = (cellOffset.left + cellWidth) - (workspaceOffset.left + viewportScrollPosition.left + workspaceWidth);
      this.instance.wtScrollbars.horizontal.setScrollPosition(viewportScrollPosition.left + delta);
    }
  }

  if (cellHeight < workspaceHeight) {
    if (cellOffset.top < viewportScrollPosition.top + horizontalCloneHeight) {
      this.instance.wtScrollbars.vertical.setScrollPosition(cellOffset.top - horizontalCloneHeight);
    }
    else if (cellOffset.top + cellHeight > viewportScrollPosition.top + workspaceHeight) {
      this.instance.wtScrollbars.vertical.setScrollPosition(cellOffset.top - workspaceHeight + cellHeight);
    }
  }
};
