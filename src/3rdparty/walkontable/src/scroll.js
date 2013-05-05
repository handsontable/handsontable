function WalkontableScroll(instance) {
  this.instance = instance;
  this.wtScrollbarV = new WalkontableVerticalScrollbar(instance);
  this.wtScrollbarH = new WalkontableHorizontalScrollbar(instance);
}

WalkontableScroll.prototype.refreshScrollbars = function () {
  this.wtScrollbarH.readSettings();
  this.wtScrollbarV.readSettings();
  this.wtScrollbarH.prepare();
  this.wtScrollbarV.prepare();
  this.wtScrollbarH.refresh();
  this.wtScrollbarV.refresh();
};

WalkontableScroll.prototype.scrollVertical = function (delta) {
  if (!this.instance.drawn) {
    throw new Error('scrollVertical can only be called after table was drawn to DOM');
  }

  var instance = this.instance
    , newOffset
    , offset = instance.getSetting('offsetRow')
    , fixedCount = instance.getSetting('fixedRowsTop')
    , total = instance.getSetting('totalRows')
    , maxSize = (instance.getSetting('height') || Infinity); //Infinity is needed, otherwise you could scroll a table that did not have height specified

  if (total > 0) {
    if (maxSize !== Infinity) {
      var TD = instance.wtTable.TBODY.firstChild.firstChild;
      if (TD.nodeName === 'TH') {
        TD = TD.nextSibling;
      }
      var cellOffset = instance.wtDom.offset(TD);
      var tableOffset = instance.wtTable.tableOffset;

      maxSize -= cellOffset.top - tableOffset.top; //column header height
      maxSize -= instance.getSetting('scrollbarHeight');
    }

    newOffset = this.scrollLogic(delta, offset, total, fixedCount, maxSize, function (row) {
      if (row - offset < fixedCount) {
        return instance.getSetting('rowHeight', row - offset);
      }
      else {
        return instance.getSetting('rowHeight', row);
      }
    });
  }
  else {
    newOffset = 0;
  }

  if (newOffset !== offset) {
    instance.update('offsetRow', newOffset);
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
    , maxSize = instance.getSetting('width') - instance.getSetting('rowHeaderWidth');

  if (total > 0) {
    newOffset = this.scrollLogic(delta, offset, total, fixedCount, maxSize, function (col) {
      if (col - offset < fixedCount) {
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
    instance.update('offsetColumn', newOffset);
  }
  return instance;
};

WalkontableScroll.prototype.scrollLogic = function (delta, offset, total, fixedCount, maxSize, cellSizeFn) {
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
    , lastVisibleColumn = this.instance.wtTable.getLastVisibleColumn()
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , fixedRowsTop = this.instance.getSetting('fixedRowsTop')
    , fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');

  if (coords[0] < 0 || coords[0] > totalRows - 1) {
    throw new Error('row ' + coords[0] + ' does not exist');
  }
  else if (coords[1] < 0 || coords[1] > totalColumns - 1) {
    throw new Error('column ' + coords[1] + ' does not exist');
  }

  if (coords[0] > lastVisibleRow) {
    this.scrollVertical(coords[0] - lastVisibleRow + 1);
  }
  else if (coords[0] === lastVisibleRow && this.instance.wtTable.isLastRowIncomplete()) {
    this.scrollVertical(coords[0] - lastVisibleRow + 1);
  }
  else if (coords[0] - fixedRowsTop < offsetRow) {
    this.scrollVertical(coords[0] - fixedRowsTop - offsetRow);
  }
  else {
    this.scrollVertical(0); //Craig's issue: remove row from the last scroll page should scroll viewport a row up if needed
  }

  if (coords[1] > lastVisibleColumn) {
    this.scrollHorizontal(coords[1] - lastVisibleColumn + 1);
  }
  else if (coords[1] === lastVisibleColumn && this.instance.wtTable.isLastColumnIncomplete()) {
    this.scrollHorizontal(coords[1] - lastVisibleColumn + 1);
  }
  else if (coords[1] - fixedColumnsLeft < offsetColumn) {
    this.scrollHorizontal(coords[1] - fixedColumnsLeft - offsetColumn);
  }
  else {
    this.scrollHorizontal(0); //Craig's issue
  }

  return this.instance;
};