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
  this.instance.wtScrollbars.horizontal.scrollTo(delta);
  return this.instance;
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

/**
 * Scrolls viewport to a cell by minimum number of cells
 * @param {WalkontableCellCoords} coords
 */
WalkontableScroll.prototype.scrollViewport = function (coords) {
  if (!this.instance.drawn) {
    return;
  }

  var offsetRow = this.instance.getSetting('offsetRow')
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns');


  if (coords.row < 0 || coords.row > totalRows - 1) {
    throw new Error('row ' + coords.row + ' does not exist');
  }

  if (coords.col < 0 || coords.col > totalColumns - 1) {
    throw new Error('column ' + coords.col + ' does not exist');
  }

  var TD = this.instance.wtTable.getCell(coords);
  if (typeof TD === 'object') {
    if (coords.col >= this.instance.getSetting('fixedColumnsLeft')) {
      this.scrollToRenderedCell(TD);
    }
  }  else if (coords.row >= this.instance.wtTable.getLastVisibleRow()) {

    this.scrollVertical(coords.row - this.instance.wtTable.getLastVisibleRow());

    if (coords.row == this.instance.wtTable.getLastVisibleRow() && this.instance.wtTable.getRowStrategy().isLastIncomplete()){
      this.scrollViewport(coords)
    }

  } else if (coords.row >= this.instance.getSetting('fixedRowsTop')){
    this.scrollVertical(coords.row - this.instance.wtTable.getFirstVisibleRow());
  }
};

WalkontableScroll.prototype.scrollToRenderedCell = function (TD) {
  var cellOffset = Handsontable.Dom.offset(TD);
  var cellWidth = Handsontable.Dom.outerWidth(TD);
  var cellHeight = Handsontable.Dom.outerHeight(TD);
  var workspaceOffset = Handsontable.Dom.offset(this.instance.wtTable.TABLE);
  var viewportScrollPosition = {
    left: this.instance.wtScrollbars.horizontal.getScrollPosition(),
    top: this.instance.wtScrollbars.vertical.getScrollPosition()
  };

  var workspaceWidth = this.instance.wtViewport.getWorkspaceWidth();
  var workspaceHeight = this.instance.wtViewport.getWorkspaceHeight();
  var leftCloneWidth = Handsontable.Dom.outerWidth(this.instance.wtScrollbars.horizontal.clone.wtTable.TABLE);
  var topCloneHeight = Handsontable.Dom.outerHeight(this.instance.wtScrollbars.vertical.clone.wtTable.TABLE);

  if (this.instance.wtScrollbars.horizontal.scrollHandler !== window) {
    workspaceOffset.left = 0;
    cellOffset.left -= Handsontable.Dom.offset(this.instance.wtScrollbars.horizontal.scrollHandler).left;
  }

  if (this.instance.wtScrollbars.vertical.scrollHandler !== window) {
    workspaceOffset.top = 0;
    cellOffset.top = cellOffset.top - Handsontable.Dom.offset(this.instance.wtScrollbars.vertical.scrollHandler).top;
  }

  if (cellWidth < workspaceWidth) {
    if (cellOffset.left < viewportScrollPosition.left + leftCloneWidth) {
      this.instance.wtScrollbars.horizontal.setScrollPosition(cellOffset.left - leftCloneWidth);
    }
    else if (cellOffset.left + cellWidth > workspaceOffset.left + viewportScrollPosition.left + workspaceWidth) {
      var delta = (cellOffset.left + cellWidth) - (workspaceOffset.left + viewportScrollPosition.left + workspaceWidth);
      this.instance.wtScrollbars.horizontal.setScrollPosition(viewportScrollPosition.left + delta);
    }
  }

  if (cellHeight < workspaceHeight) {
    if (cellOffset.top < viewportScrollPosition.top + topCloneHeight) {
      this.instance.wtScrollbars.vertical.setScrollPosition(cellOffset.top - topCloneHeight);
      this.instance.wtScrollbars.vertical.onScroll();
    }
    else if (cellOffset.top + cellHeight > viewportScrollPosition.top + workspaceHeight) {
      this.instance.wtScrollbars.vertical.setScrollPosition(cellOffset.top - workspaceHeight + cellHeight);
      this.instance.wtScrollbars.vertical.onScroll();
    }
  }

};
