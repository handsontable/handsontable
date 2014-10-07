function WalkontableTable(instance, table) {
  //reference to instance
  this.instance = instance;
  this.TABLE = table;
  Handsontable.Dom.removeTextNodes(this.TABLE);

  //wtSpreader
  var parent = this.TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
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
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
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
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';

    if(!instance.cloneSource) {
      holder.className += ' ht_master';
    }

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

  this.rowFilter = null;
  this.columnFilter = null;

  this.columnWidthCache = [];
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
  if (!selectionsOnly) {
    if (this.isWorkingOnClone()) {
      this.tableOffset = this.instance.cloneSource.wtTable.tableOffset;
    }
    else {
      this.holderOffset = Handsontable.Dom.offset(this.holder);
      this.tableOffset = Handsontable.Dom.offset(this.TABLE);
      this.instance.wtScrollbars.vertical.readSettings();
      this.instance.wtScrollbars.horizontal.readSettings();
      this.instance.wtViewport.resetSettings();
    }
    var offsetRow;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay
        || this.instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative
        || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
      offsetRow = 0;
    }
    else {
      offsetRow = this.instance.wtSettings.settings.offsetRow;
    }

    this.rowFilter = new WalkontableRowFilter(
      offsetRow,
      this.instance.getSetting('totalRows'),
      this.instance.getSetting('columnHeaders').length
    );
    this.columnFilter = new WalkontableColumnFilter(
      this.instance.getSetting('totalColumns'),
      this.instance.getSetting('rowHeaders').length
    );
    this._doDraw();
  }
  else {
    this.instance.wtScrollbars && this.instance.wtScrollbars.refresh(true);
  }

  this.refreshPositions(selectionsOnly);

  if (!this.isWorkingOnClone()) {
    this.instance.wtScrollbars.vertical.resetFixedPosition();
    this.instance.wtScrollbars.horizontal.resetFixedPosition();
    this.instance.wtScrollbars.corner.resetFixedPosition();
    this.instance.wtScrollbars.debug && this.instance.wtScrollbars.debug.resetFixedPosition();
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

WalkontableTable.prototype.removeClassFromCells = function (className) {
  var nodes = this.TABLE.querySelectorAll('.' + className);
  for (var i = 0, ilen = nodes.length; i < ilen; i++) {
    Handsontable.Dom.removeClass(nodes[i], className);
  }
};

WalkontableTable.prototype.refreshSelections = function (selectionsOnly) {
  if (this.instance.selections) {
    if(selectionsOnly) {
    for (var i = 0, ilen = this.instance.selections.length; i < ilen; i++) {
        //there was no rerender, so we need to remove classNames by ourselves
        if (this.instance.selections[i].settings.className) {
          this.removeClassFromCells(this.instance.selections[i].settings.className);
        }
        if (this.instance.selections[i].settings.highlightRowClassName) {
          this.removeClassFromCells(this.instance.selections[i].settings.highlightRowClassName);
        }
        if (this.instance.selections[i].settings.highlightColumnClassName) {
          this.removeClassFromCells(this.instance.selections[i].settings.highlightColumnClassName);
        }
      }
    }

    for (var i = 0, ilen = this.instance.selections.length; i < ilen; i++) {
      this.instance.selections[i].draw(this.instance, selectionsOnly);
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
 * getColumnHeader
 * @param col
 * @return {Object} HTMLElement on success or undefined on error
 *
 */
WalkontableTable.prototype.getColumnHeader = function(col) {
  var THEAD = this.THEAD.childNodes[0];
  if (THEAD) {
    return THEAD.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(col)];
  }
};

/**
 * getRowHeader
 * @param row
 * @return {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  null table doesn't have row headers
 *
 */
WalkontableTable.prototype.getRowHeader = function(row) {
  if(this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) == 0) {
    return null;
  }

  var TR = this.TBODY.childNodes[this.rowFilter.sourceToVisible(row)];

  if (TR) {
    return TR.childNodes[0];
  }
};

/**
 * Returns cell coords object for a given TD
 * @param TD
 * @returns {WalkontableCellCoords}
 */
WalkontableTable.prototype.getCoords = function (TD) {
  var TR = TD.parentNode;
  var row = Handsontable.Dom.index(TR);
  if (TR.parentNode === this.THEAD) {
    row = this.rowFilter.visibleColHeadedRowToSourceRow(row);
  }
  else {
    row = this.rowFilter.visibleToSource(row);
  }

  return new WalkontableCellCoords(
    row,
    this.columnFilter.visibleRowHeadedColumnToSourceColumn(TD.cellIndex)
  );
};

WalkontableTable.prototype.getTrForRow = function (row) {
  return this.TBODY.childNodes[this.rowFilter.sourceToVisible(row)];
};

//returns -1 if no row is visible
WalkontableTable.prototype.getFirstVisibleRow = function () {
  return this.rowFilter.visibleToSource(0);
};

//returns -1 if no column is visible
WalkontableTable.prototype.getFirstVisibleColumn = function () {

  if (this.isWorkingOnClone()){
    if (this.instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative){
      return 0;
    } else {
      return this.instance.cloneSource.wtTable.getFirstVisibleColumn();
    }
  }

  var leftOffset = this.instance.wtScrollbars.horizontal.getScrollPosition();
  var columnCount = this.getColumnStrategy().cellCount;
  var firstTR = this.TBODY.firstChild;

  if (!firstTR){
    return 0;
  }

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
  var rowHeaderCount = this.instance.getSetting('rowHeaders').length || 0;
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
  return (this.rowFilter.sourceToVisible(r) < 0 && r >= 0);
};

WalkontableTable.prototype.isRowAfterViewport = function (r) {
  return (r > this.getLastVisibleRow());
};

WalkontableTable.prototype.isColumnBeforeViewport = function (c) {
  return (this.columnFilter.sourceToVisible(c) < 0 && c >= 0);
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
