function WalkontableScroll(instance) {
  this.instance = instance;
}

/**
 * Scrolls viewport to a cell by minimum number of cells
 * @param {WalkontableCellCoords} coords
 */
WalkontableScroll.prototype.scrollViewport = function (coords) {
  if (!this.instance.drawn) {
    return;
  }

  var totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns');

  if (coords.row < 0 || coords.row > totalRows - 1) {
    throw new Error('row ' + coords.row + ' does not exist');
  }

  if (coords.col < 0 || coords.col > totalColumns - 1) {
    throw new Error('column ' + coords.col + ' does not exist');
  }

  var TD = this.instance.getCell(coords, true);
  if (typeof TD === 'object') {
    if (coords.col >= this.instance.getSetting('fixedColumnsLeft') && coords.row >= this.instance.getSetting('fixedRowsTop')) {
      this.scrollToRenderedCell(TD);
    }
  } else {
    var verticalScrollParams = [],
        horizontalScrollParams = [];

    if (coords.row >= this.instance.wtTable.getLastVisibleRow()) {
      verticalScrollParams[0] = coords.row;
      verticalScrollParams[1] = true;
    } else if (coords.row >= this.instance.getSetting('fixedRowsTop')){
      verticalScrollParams[0] = coords.row;
    }

    if (coords.col >= this.instance.wtTable.getLastVisibleColumn()) {
      horizontalScrollParams[0] = coords.col;
      horizontalScrollParams[1] = true;
    } else if (coords.col >= this.instance.getSetting('fixedColumnsLeft')){
      horizontalScrollParams[0] = coords.col;
    }

    if(verticalScrollParams.length != 0) {
      this.instance.wtScrollbars.vertical.scrollTo(verticalScrollParams[0], verticalScrollParams[1]);
    }
    if(horizontalScrollParams.length != 0) {
      this.instance.wtScrollbars.horizontal.scrollTo(horizontalScrollParams[0],horizontalScrollParams[1]);
    }
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
      this.instance.wtScrollbars.horizontal.onScroll();
    }
    else if (cellOffset.left + cellWidth > workspaceOffset.left + viewportScrollPosition.left + workspaceWidth) {
      var delta = (cellOffset.left + cellWidth) - (workspaceOffset.left + viewportScrollPosition.left + workspaceWidth);
      this.instance.wtScrollbars.horizontal.setScrollPosition(viewportScrollPosition.left + delta);
      this.instance.wtScrollbars.horizontal.onScroll();
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
