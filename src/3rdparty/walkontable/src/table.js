function WalkontableTable(instance, table) {
  //reference to instance
  this.instance = instance;
  this.TABLE = table;
  this.wtDom = this.instance.wtDom;
  this.wtDom.removeTextNodes(this.TABLE);

  //wtSpreader
  var parent = this.TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !this.wtDom.hasClass(parent, 'wtHolder')) {
    var spreader = document.createElement('DIV');
    spreader.className = 'wtSpreader';
    if (parent) {
      parent.insertBefore(spreader, this.TABLE); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    spreader.appendChild(this.TABLE);
  }
  this.spreader = this.TABLE.parentNode;

  //wtHider
  parent = this.spreader.parentNode;
  if (!parent || parent.nodeType !== 1 || !this.wtDom.hasClass(parent, 'wtHolder')) {
    var hider = document.createElement('DIV');
    hider.className = 'wtHider';
    if (parent) {
      parent.insertBefore(hider, this.spreader); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    hider.appendChild(this.spreader);
  }
  this.hider = this.spreader.parentNode;
  this.hiderStyle = this.hider.style;
  this.hiderStyle.position = 'relative';

  //wtHolder
  parent = this.hider.parentNode;
  if (!parent || parent.nodeType !== 1 || !this.wtDom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';
    if (parent) {
      parent.insertBefore(holder, this.hider); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    holder.appendChild(this.hider);
  }
  this.holder = this.hider.parentNode;

  //bootstrap from settings
  this.TBODY = this.TABLE.getElementsByTagName('TBODY')[0];
  if (!this.TBODY) {
    this.TBODY = document.createElement('TBODY');
    this.TABLE.appendChild(this.TBODY);
  }
  this.THEAD = this.TABLE.getElementsByTagName('THEAD')[0];
  if (!this.THEAD) {
    this.THEAD = document.createElement('THEAD');
    this.TABLE.insertBefore(this.THEAD, this.TBODY);
  }
  this.COLGROUP = this.TABLE.getElementsByTagName('COLGROUP')[0];
  if (!this.COLGROUP) {
    this.COLGROUP = document.createElement('COLGROUP');
    this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
  }

  if (this.instance.getSetting('columnHeaders').length) {
    if (!this.THEAD.childNodes.length) {
      var TR = document.createElement('TR');
      this.THEAD.appendChild(TR);
    }
  }

  this.colgroupChildrenLength = this.COLGROUP.childNodes.length;
  this.theadChildrenLength = this.THEAD.firstChild ? this.THEAD.firstChild.childNodes.length : 0;
  this.tbodyChildrenLength = this.TBODY.childNodes.length;

  this.oldCellCache = new WalkontableClassNameCache();
  this.currentCellCache = new WalkontableClassNameCache();

  this.rowFilter = new WalkontableRowFilter();
  this.columnFilter = new WalkontableColumnFilter();
}

WalkontableTable.prototype.getRowStrategy = function () {
  return this.isWorkingOnClone() ? this.instance.cloneSource.wtTable.rowStrategy : this.rowStrategy;
};

WalkontableTable.prototype.getColumnStrategy = function () {
  return this.isWorkingOnClone() ? this.instance.cloneSource.wtTable.columnStrategy : this.columnStrategy;
};

WalkontableTable.prototype.isWorkingOnClone = function () {
  return !!this.instance.cloneSource;
};

WalkontableTable.prototype.refreshHiderDimensions = function () {
  var spreaderStyle = this.spreader.style;
  spreaderStyle.position = 'relative';
  spreaderStyle.width = 'auto';
  spreaderStyle.height = 'auto';
};

WalkontableTable.prototype.draw = function (selectionsOnly) {

  this.rowFilter.readSettings(this.instance);
  this.columnFilter.readSettings(this.instance);

  if (!selectionsOnly) {
    if (this.isWorkingOnClone()) {
      this.tableOffset = this.instance.cloneSource.wtTable.tableOffset;
    }
    else {
      this.holderOffset = this.wtDom.offset(this.holder);
      this.tableOffset = this.wtDom.offset(this.TABLE);
      this.instance.wtScrollbars.vertical.readWindowSize();
      this.instance.wtScrollbars.horizontal.readWindowSize();
      this.instance.wtViewport.resetSettings();
    }
    this._doDraw();
  }
  else {
    this.instance.wtScrollbars && this.instance.wtScrollbars.refresh(true);
  }

  this.refreshPositions(selectionsOnly);

  if (!selectionsOnly) {
    if (!this.isWorkingOnClone()) {
      this.instance.wtScrollbars.vertical.resetFixedPosition();
      this.instance.wtScrollbars.horizontal.resetFixedPosition();
      this.instance.wtScrollbars.corner.resetFixedPosition();
      this.instance.wtScrollbars.debug && this.instance.wtScrollbars.debug.resetFixedPosition();
    }
  }

  this.instance.drawn = true;
  return this;
};

WalkontableTable.prototype._doDraw = function () {
  var wtRenderer = new WalkontableTableRenderer(this);
  wtRenderer.render();
};

WalkontableTable.prototype.refreshPositions = function (selectionsOnly) {
  this.refreshHiderDimensions();
  this.refreshSelections(selectionsOnly);
};

WalkontableTable.prototype.refreshSelections = function (selectionsOnly) {
  var vr
    , r
    , vc
    , c
    , s
    , slen
    , classNames = []
    , visibleRows = this.getRowStrategy().countVisible()
    , visibleColumns = this.getColumnStrategy().countVisible();

  this.oldCellCache = this.currentCellCache;
  this.currentCellCache = new WalkontableClassNameCache();

  if (this.instance.selections) {
    for (r in this.instance.selections) {
      if (this.instance.selections.hasOwnProperty(r)) {

        this.instance.selections[r].draw();

        if (this.instance.selections[r].settings.className) {
          classNames.push(this.instance.selections[r].settings.className);
        }
        if (this.instance.selections[r].settings.highlightRowClassName) {
          classNames.push(this.instance.selections[r].settings.highlightRowClassName);
        }
        if (this.instance.selections[r].settings.highlightColumnClassName) {
          classNames.push(this.instance.selections[r].settings.highlightColumnClassName);
        }
      }
    }
  }

  slen = classNames.length;

  for (vr = 0; vr < visibleRows; vr++) {
    for (vc = 0; vc < visibleColumns; vc++) {
      r = this.rowFilter.visibleToSource(vr);
      c = this.columnFilter.visibleToSource(vc);
      for (s = 0; s < slen; s++) {
        var cell;
        if (this.currentCellCache.test(vr, vc, classNames[s])) {
          cell = this.getCell(new WalkontableCellCoords(r, c));
          if (typeof cell == 'object' ) this.wtDom.addClass(cell, classNames[s]);
        }
        else if (selectionsOnly && this.oldCellCache.test(vr, vc, classNames[s])) {
          cell = this.getCell(new WalkontableCellCoords(r, c));
          if (typeof cell == 'object' ) this.wtDom.removeClass(cell, classNames[s]);

        }
      }
    }
  }
};

/**
 * getCell
 * @param {WalkontableCellCoords} coords
 * @return {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  -1 row before viewport
 *  -2 row after viewport
 *
 */
WalkontableTable.prototype.getCell = function (coords) {
  if (this.isRowBeforeViewport(coords.row)) {
    return -1; //row before viewport
  }
  else if (this.isRowAfterViewport(coords.row)) {
    return -2; //row after viewport
  }

  var TR = this.TBODY.childNodes[this.rowFilter.sourceToVisible(coords.row)];

  if (TR) {
    return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(coords.col)];
  }
};

/**
 * Returns cell coords object for a given TD
 * @param TD
 * @returns {WalkontableCellCoords}
 */
WalkontableTable.prototype.getCoords = function (TD) {
  return new WalkontableCellCoords(
    this.rowFilter.visibleToSource(this.wtDom.index(TD.parentNode)),
    this.columnFilter.visibleRowHeadedColumnToSourceColumn(TD.cellIndex)
  );
};

//returns -1 if no row is visible
WalkontableTable.prototype.getFirstVisibleRow = function () {
  return this.rowFilter.visibleToSource(0 + this.rowFilter.fixedCount);
};

//returns -1 if no column is visible
WalkontableTable.prototype.getFirstVisibleColumn = function () {
  var leftOffset = this.instance.wtScrollbars.horizontal.getScrollPosition();
  var columnCount = this.getColumnStrategy().cellCount;
  var firstTR = this.TBODY.firstChild;

  for (var colIndex = 0; colIndex < columnCount; colIndex++){
    leftOffset -= firstTR.childNodes[colIndex].offsetWidth;

    if (leftOffset < 0){
      return colIndex;
    }

  }

  return -1;
};

//returns -1 if no row is visible
WalkontableTable.prototype.getLastVisibleRow = function () {
  var lastVisibleRow =  this.rowFilter.visibleToSource(this.getRowStrategy().countVisible() - 1);
  var instance = this.instance;

  if (instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    var fixedRowsTop = this.instance.getSetting('fixedRowsTop');

    return Math.min(fixedRowsTop - 1, lastVisibleRow);
  } else {
    return lastVisibleRow;
  }

};

//returns -1 if no column is visible
WalkontableTable.prototype.getLastVisibleColumn = function () {
  var instance = this.instance;

  if (this.isWorkingOnClone()){

    if (instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative){
      var lastVisibleColumn = this.getColumnStrategy().countVisible() - 1;
      var fixedColumnsLeft =  instance.getSetting('fixedColumnsLeft');
      return Math.min(fixedColumnsLeft - 1, lastVisibleColumn);
    } else {
      return this.instance.cloneSource.wtTable.getLastVisibleColumn();
    }

  }


  var leftOffset = this.instance.wtScrollbars.horizontal.getScrollPosition();
  var leftPartOfTable = leftOffset + this.instance.wtViewport.getWorkspaceWidth(Infinity);
  var columnCount = this.getColumnStrategy().cellCount;
  var rowHeaderCount = this.instance.getSetting('rowHeaders').length || 0
  var firstTR = this.TBODY.firstChild;

  if (!columnCount) {
    return -1;
  }

  for (var colIndex = 0; colIndex < columnCount + rowHeaderCount; colIndex++){
    leftPartOfTable -= firstTR.childNodes[colIndex].offsetWidth;

    if (leftPartOfTable <= 0){
      return colIndex - rowHeaderCount;
    }

  }

  return colIndex - rowHeaderCount - 1;
};

WalkontableTable.prototype.isRowBeforeViewport = function (r) {
  return (this.rowFilter.sourceToVisible(r) < this.rowFilter.fixedCount && r >= this.rowFilter.fixedCount);
};

WalkontableTable.prototype.isRowAfterViewport = function (r) {
  return (r > this.getLastVisibleRow());
};

WalkontableTable.prototype.isColumnBeforeViewport = function (c) {
  return (this.columnFilter.sourceToVisible(c) < this.columnFilter.fixedCount && c >= this.columnFilter.fixedCount);
};

WalkontableTable.prototype.isColumnAfterViewport = function (c) {
  return (c > this.getLastVisibleColumn());
};

WalkontableTable.prototype.isRowInViewport = function (r) {
  return (!this.isRowBeforeViewport(r) && !this.isRowAfterViewport(r));
};

WalkontableTable.prototype.isColumnInViewport = function (c) {
  return (!this.isColumnBeforeViewport(c) && !this.isColumnAfterViewport(c));
};

WalkontableTable.prototype.isLastRowFullyVisible = function () {
  return (this.getLastVisibleRow() === this.instance.getSetting('totalRows') - 1 && !this.getRowStrategy().isLastIncomplete());
};

WalkontableTable.prototype.isLastColumnFullyVisible = function () {
  return (this.getLastVisibleColumn() === this.instance.getSetting('totalColumns') - 1 && !this.getColumnStrategy().isLastIncomplete());
};

WalkontableTable.prototype.getVisibleRowsCount = function () {
  return this.getRowStrategy().countVisible();
};

WalkontableTable.prototype.allRowsInViewport = function () {
  return this.getRowStrategy().cellCount == this.getVisibleRowsCount();
};
